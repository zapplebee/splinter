// Copyright 2019 Cargill Incorporated
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use super::{get_response_paging_info, Paging, DEFAULT_LIMIT, DEFAULT_OFFSET, QUERY_ENCODE_SET};
use percent_encoding::utf8_percent_encode;
use splinter::actix_web::{error::BlockingError, web, Error, HttpRequest, HttpResponse};
use splinter::futures::{future::IntoFuture, stream::Stream, Future};
use splinter::{
    node_registry::{error::NodeRegistryError, Node, NodeRegistry},
    rest_api::{Method, Resource},
};
use std::collections::HashMap;

type Filter = HashMap<String, (String, String)>;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ListNodesResponse {
    data: Vec<Node>,
    paging: Paging,
}

pub fn make_nodes_identity_resource(registry: Box<dyn NodeRegistry>) -> Resource {
    let registry1 = registry.clone();
    let registry2 = registry.clone();
    Resource::build("/nodes/{identity}")
        .add_method(Method::Get, move |r, _| {
            fetch_node(r, web::Data::new(registry.clone()))
        })
        .add_method(Method::Patch, move |r, p| {
            update_node(r, p, web::Data::new(registry1.clone()))
        })
        .add_method(Method::Delete, move |r, _| {
            delete_node(r, web::Data::new(registry2.clone()))
        })
}

pub fn make_nodes_resource(registry: Box<dyn NodeRegistry>) -> Resource {
    let registry1 = registry.clone();
    Resource::build("/nodes")
        .add_method(Method::Get, move |r, _| {
            list_nodes(r, web::Data::new(registry.clone()))
        })
        .add_method(Method::Post, move |_, p| {
            add_node(p, web::Data::new(registry1.clone()))
        })
}

fn fetch_node(
    request: HttpRequest,
    registry: web::Data<Box<dyn NodeRegistry>>,
) -> Box<dyn Future<Item = HttpResponse, Error = Error>> {
    let identity = request
        .match_info()
        .get("identity")
        .unwrap_or("")
        .to_string();
    Box::new(
        web::block(move || registry.fetch_node(&identity)).then(|res| match res {
            Ok(node) => Ok(HttpResponse::Ok().json(node)),
            Err(err) => match err {
                BlockingError::Error(err) => match err {
                    NodeRegistryError::NotFoundError(err) => Ok(HttpResponse::NotFound().json(err)),
                    _ => Ok(HttpResponse::InternalServerError().json(format!("{}", err))),
                },
                _ => Ok(HttpResponse::InternalServerError().json(format!("{}", err))),
            },
        }),
    )
}

fn update_node(
    request: HttpRequest,
    payload: web::Payload,
    registry: web::Data<Box<dyn NodeRegistry>>,
) -> Box<dyn Future<Item = HttpResponse, Error = Error>> {
    let identity = request
        .match_info()
        .get("identity")
        .unwrap_or("")
        .to_string();
    Box::new(
        payload
            .from_err::<Error>()
            .fold(web::BytesMut::new(), move |mut body, chunk| {
                body.extend_from_slice(&chunk);
                Ok::<_, Error>(body)
            })
            .into_future()
            .and_then(
                move |body| match serde_json::from_slice::<HashMap<String, String>>(&body) {
                    Ok(updates) => Box::new(
                        web::block(move || registry.update_node(&identity, updates)).then(|res| {
                            Ok(match res {
                                Ok(_) => HttpResponse::Ok().finish(),
                                Err(err) => match err {
                                    BlockingError::Error(err) => match err {
                                        NodeRegistryError::NotFoundError(err) => {
                                            HttpResponse::NotFound().json(err)
                                        }
                                        _ => HttpResponse::InternalServerError()
                                            .json(format!("{}", err)),
                                    },
                                    _ => {
                                        HttpResponse::InternalServerError().json(format!("{}", err))
                                    }
                                },
                            })
                        }),
                    )
                        as Box<dyn Future<Item = HttpResponse, Error = Error>>,
                    Err(err) => Box::new(
                        HttpResponse::BadRequest()
                            .json(format!("invalid updates: {}", err))
                            .into_future(),
                    ),
                },
            ),
    )
}

fn delete_node(
    request: HttpRequest,
    registry: web::Data<Box<dyn NodeRegistry>>,
) -> Box<dyn Future<Item = HttpResponse, Error = Error>> {
    let identity = request
        .match_info()
        .get("identity")
        .unwrap_or("")
        .to_string();
    Box::new(
        web::block(move || registry.delete_node(&identity)).then(|res| match res {
            Ok(_) => Ok(HttpResponse::Ok().finish()),
            Err(err) => match err {
                BlockingError::Error(err) => match err {
                    NodeRegistryError::NotFoundError(err) => Ok(HttpResponse::NotFound().json(err)),
                    _ => Ok(HttpResponse::InternalServerError().json(format!("{}", err))),
                },
                _ => Ok(HttpResponse::InternalServerError().json(format!("{}", err))),
            },
        }),
    )
}

fn list_nodes(
    req: HttpRequest,
    registry: web::Data<Box<dyn NodeRegistry>>,
) -> Box<dyn Future<Item = HttpResponse, Error = Error>> {
    let query: web::Query<HashMap<String, String>> =
        if let Ok(q) = web::Query::from_query(req.query_string()) {
            q
        } else {
            return Box::new(
                HttpResponse::BadRequest()
                    .json(json!({
                        "message": "Invalid query"
                    }))
                    .into_future(),
            );
        };

    let offset = match query.get("offset") {
        Some(value) => match value.parse::<usize>() {
            Ok(val) => val,
            Err(err) => {
                return Box::new(
                    HttpResponse::BadRequest()
                        .json(format!(
                            "Invalid offset value passed: {}. Error: {}",
                            value, err
                        ))
                        .into_future(),
                )
            }
        },
        None => DEFAULT_OFFSET,
    };

    let limit = match query.get("limit") {
        Some(value) => match value.parse::<usize>() {
            Ok(val) => val,
            Err(err) => {
                return Box::new(
                    HttpResponse::BadRequest()
                        .json(format!(
                            "Invalid limit value passed: {}. Error: {}",
                            value, err
                        ))
                        .into_future(),
                )
            }
        },
        None => DEFAULT_LIMIT,
    };

    let mut link = format!("{}?", req.uri().path());

    let filters = match query.get("filter") {
        Some(value) => match serde_json::from_str(value) {
            Ok(val) => {
                link.push_str(&format!(
                    "filter={}&",
                    utf8_percent_encode(value, QUERY_ENCODE_SET).to_string()
                ));
                Some(val)
            }
            Err(err) => {
                return Box::new(
                    HttpResponse::BadRequest()
                        .json(format!(
                            "Invalid filter value passed: {}. Error: {}",
                            value, err
                        ))
                        .into_future(),
                )
            }
        },
        None => None,
    };

    Box::new(query_list_nodes(
        registry,
        link,
        filters,
        Some(offset),
        Some(limit),
    ))
}

fn query_list_nodes(
    registry: web::Data<Box<dyn NodeRegistry>>,
    link: String,
    filters: Option<Filter>,
    offset: Option<usize>,
    limit: Option<usize>,
) -> impl Future<Item = HttpResponse, Error = Error> {
    web::block(
        move || match registry.list_nodes(filters.clone(), None, None) {
            Ok(nodes) => Ok((registry, filters, nodes.len(), link, limit, offset)),
            Err(err) => Err(err),
        },
    )
    .and_then(|(registry, filters, total_count, link, limit, offset)| {
        web::block(move || match registry.list_nodes(filters, limit, offset) {
            Ok(nodes) => Ok((nodes, link, limit, offset, total_count)),
            Err(err) => Err(err),
        })
    })
    .then(|res| match res {
        Ok((nodes, link, limit, offset, total_count)) => {
            Ok(HttpResponse::Ok().json(ListNodesResponse {
                data: nodes,
                paging: get_response_paging_info(limit, offset, &link, total_count),
            }))
        }
        Err(err) => match err {
            BlockingError::Error(err) => match err {
                NodeRegistryError::InvalidFilterError(err) => {
                    Ok(HttpResponse::BadRequest().json(err))
                }
                _ => Ok(HttpResponse::InternalServerError().into()),
            },
            _ => Ok(HttpResponse::InternalServerError().into()),
        },
    })
}

fn add_node(
    payload: web::Payload,
    registry: web::Data<Box<dyn NodeRegistry>>,
) -> Box<dyn Future<Item = HttpResponse, Error = Error>> {
    Box::new(
        payload
            .from_err::<Error>()
            .fold(web::BytesMut::new(), move |mut body, chunk| {
                body.extend_from_slice(&chunk);
                Ok::<_, Error>(body)
            })
            .into_future()
            .and_then(move |body| match serde_json::from_slice::<Node>(&body) {
                Ok(node) => Box::new(web::block(move || registry.add_node(node)).then(|res| {
                    Ok(match res {
                        Ok(_) => HttpResponse::Ok().finish(),
                        Err(err) => match err {
                            BlockingError::Error(err) => match err {
                                NodeRegistryError::DuplicateNodeError(id) => {
                                    HttpResponse::Forbidden()
                                        .json(format!("node with with ID ({}) already exists", id))
                                }
                                _ => HttpResponse::InternalServerError().json(format!("{}", err)),
                            },
                            _ => HttpResponse::InternalServerError().json(format!("{}", err)),
                        },
                    })
                }))
                    as Box<dyn Future<Item = HttpResponse, Error = Error>>,
                Err(err) => Box::new(
                    HttpResponse::BadRequest()
                        .json(format!("invalid node: {}", err))
                        .into_future(),
                ),
            }),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use splinter::node_registry::yaml::YamlNodeRegistry;
    use splinter::node_registry::Node;
    use std::collections::HashMap;
    use std::env;
    use std::fs::{remove_file, File};
    use std::panic;
    use std::thread;

    use splinter::actix_web::{
        http::{header, StatusCode},
        test, web, App,
    };

    #[test]
    /// Tests a GET /nodes/{identity} request returns the expected node.
    fn test_fetch_node_ok() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1(), get_node_2()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(App::new().data(node_registry.clone()).service(
                web::resource("/nodes/{identity}").route(web::get().to_async(fetch_node)),
            ));

            let req = test::TestRequest::get()
                .uri(&format!("/nodes/{}", get_node_1().identity))
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);
            let node: Node = serde_yaml::from_slice(&test::read_body(resp)).unwrap();
            assert_eq!(node, get_node_1())
        })
    }

    #[test]
    /// Tests a GET /nodes/{identity} request returns NotFound when an invalid identity is passed
    fn test_fetch_node_not_found() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1(), get_node_2()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(App::new().data(node_registry.clone()).service(
                web::resource("/nodes/{identity}").route(web::get().to_async(fetch_node)),
            ));

            let req = test::TestRequest::get()
                .uri("/nodes/Node-not-valid")
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::NOT_FOUND);
        })
    }

    #[test]
    /// Test the PATCH /nodes/{identity} route for updating the metadata of a node in the registry.
    fn test_update_node() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(
                App::new().data(node_registry.clone()).service(
                    web::resource("/nodes/{identity}")
                        .route(web::patch().to_async(update_node))
                        .route(web::get().to_async(fetch_node)),
                ),
            );

            // Verify invalid updates (e.g. no updates) gets a BAD_REQUEST response
            let req = test::TestRequest::patch()
                .uri(&format!("/nodes/{}", get_node_1().identity))
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

            // Verify that updating an existing node gets an OK response and the fetched node has
            // the updated metadata
            let updated_key = "location".to_string();
            let updated_value = "Minneapolis".to_string();
            let mut updates = HashMap::new();
            updates.insert(updated_key.clone(), updated_value.clone());

            let req = test::TestRequest::patch()
                .uri(&format!("/nodes/{}", get_node_1().identity))
                .header(header::CONTENT_TYPE, "application/json")
                .set_json(&updates)
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);

            let req = test::TestRequest::get()
                .uri(&format!("/nodes/{}", get_node_1().identity))
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);
            let node: Node = serde_yaml::from_slice(&test::read_body(resp)).unwrap();
            assert_eq!(
                node.metadata
                    .get(&updated_key)
                    .expect("updated value doesn't exist"),
                &updated_value
            );

            // Verify that updating a non-existent node gets a NOT_FOUND response
            let req = test::TestRequest::patch()
                .uri(&format!("/nodes/{}", get_node_2().identity))
                .header(header::CONTENT_TYPE, "application/json")
                .set_json(&updates)
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::NOT_FOUND);
        })
    }

    #[test]
    /// Test the DELETE /nodes/{identity} route for deleting a node from the registry.
    fn test_delete_node() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(App::new().data(node_registry.clone()).service(
                web::resource("/nodes/{identity}").route(web::delete().to_async(delete_node)),
            ));

            // Verify that an existing node gets an OK response
            let req = test::TestRequest::delete()
                .uri(&format!("/nodes/{}", get_node_1().identity))
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);

            // Verify that a non-existent node gets a NOT_FOUND response
            let req = test::TestRequest::delete()
                .uri(&format!("/nodes/{}", get_node_1().identity))
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::NOT_FOUND);
        })
    }

    #[test]
    /// Tests a GET /nodes request with no filters returns the expected nodes.
    fn test_list_node_ok() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1(), get_node_2()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(
                App::new()
                    .data(node_registry.clone())
                    .service(web::resource("/nodes").route(web::get().to_async(list_nodes))),
            );

            let req = test::TestRequest::get().uri("/nodes").to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);
            let nodes: ListNodesResponse = serde_yaml::from_slice(&test::read_body(resp)).unwrap();
            assert_eq!(nodes.data, vec![get_node_1(), get_node_2()]);
            assert_eq!(
                nodes.paging,
                create_test_paging_response(0, 100, 0, 0, 0, 2, "/nodes?")
            )
        })
    }

    #[test]
    /// Tests a GET /nodes request with filters returns the expected node.
    fn test_list_node_with_filters_ok() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1(), get_node_2()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(
                App::new()
                    .data(node_registry.clone())
                    .service(web::resource("/nodes").route(web::get().to_async(list_nodes))),
            );

            let filter =
                utf8_percent_encode("{\"company\":[\"=\",\"Bitwise IO\"]}", QUERY_ENCODE_SET)
                    .to_string();

            let req = test::TestRequest::get()
                .uri(&format!("/nodes?filter={}", filter))
                .header(header::CONTENT_TYPE, "application/json")
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);
            let nodes: ListNodesResponse = serde_yaml::from_slice(&test::read_body(resp)).unwrap();
            assert_eq!(nodes.data, vec![get_node_1()]);
            let link = format!("/nodes?filter={}&", filter);
            assert_eq!(
                nodes.paging,
                create_test_paging_response(0, 100, 0, 0, 0, 1, &link)
            )
        })
    }

    #[test]
    /// Tests a GET /nodes request with invalid filter returns BadRequest response.
    fn test_list_node_with_filters_bad_request() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[get_node_1(), get_node_2()]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(
                App::new()
                    .data(node_registry.clone())
                    .service(web::resource("/nodes").route(web::get().to_async(list_nodes))),
            );

            let filter =
                utf8_percent_encode("{\"company\":[\"*\",\"Bitwise IO\"]}", QUERY_ENCODE_SET)
                    .to_string();

            let req = test::TestRequest::get()
                .uri(&format!("/nodes?filter={}", filter))
                .header(header::CONTENT_TYPE, "application/json")
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
        })
    }

    #[test]
    /// Test the POST /nodes route for adding a node to the registry.
    fn test_add_node() {
        run_test(|test_yaml_file_path| {
            write_to_file(&test_yaml_file_path, &[]);

            let node_registry: Box<dyn NodeRegistry> = Box::new(
                YamlNodeRegistry::new(test_yaml_file_path)
                    .expect("Error creating YamlNodeRegistry"),
            );

            let mut app = test::init_service(
                App::new()
                    .data(node_registry.clone())
                    .service(web::resource("/nodes").route(web::post().to_async(add_node))),
            );

            // Verify an invalid node gets a BAD_REQUEST response
            let req = test::TestRequest::post()
                .uri("/nodes")
                .header(header::CONTENT_TYPE, "application/json")
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

            // Verify a valid node gets an OK response
            let req = test::TestRequest::post()
                .uri("/nodes")
                .header(header::CONTENT_TYPE, "application/json")
                .set_json(&get_node_1())
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::OK);

            // Verify a duplicate node gets a FORBIDDEN response
            let req = test::TestRequest::post()
                .uri("/nodes")
                .header(header::CONTENT_TYPE, "application/json")
                .set_json(&get_node_1())
                .to_request();

            let resp = test::call_service(&mut app, req);

            assert_eq!(resp.status(), StatusCode::FORBIDDEN);
        })
    }

    fn create_test_paging_response(
        offset: usize,
        limit: usize,
        next_offset: usize,
        previous_offset: usize,
        last_offset: usize,
        total: usize,
        link: &str,
    ) -> Paging {
        let base_link = format!("{}limit={}&", link, limit);
        let current_link = format!("{}offset={}", base_link, offset);
        let first_link = format!("{}offset=0", base_link);
        let next_link = format!("{}offset={}", base_link, next_offset);
        let previous_link = format!("{}offset={}", base_link, previous_offset);
        let last_link = format!("{}offset={}", base_link, last_offset);

        Paging {
            current: current_link,
            offset,
            limit,
            total,
            first: first_link,
            prev: previous_link,
            next: next_link,
            last: last_link,
        }
    }

    fn write_to_file(file_path: &str, nodes: &[Node]) {
        let file = File::create(file_path).expect("Error creating test nodes yaml file.");
        serde_yaml::to_writer(file, nodes).expect("Error writing nodes to file.");
    }

    fn get_node_1() -> Node {
        let mut metadata = HashMap::new();
        metadata.insert("url".to_string(), "12.0.0.123:8431".to_string());
        metadata.insert("company".to_string(), "Bitwise IO".to_string());
        Node {
            identity: "Node-123".to_string(),
            metadata,
        }
    }

    fn get_node_2() -> Node {
        let mut metadata = HashMap::new();
        metadata.insert("url".to_string(), "13.0.0.123:8434".to_string());
        metadata.insert("company".to_string(), "Cargill".to_string());
        Node {
            identity: "Node-456".to_string(),
            metadata,
        }
    }

    fn run_test<T>(test: T) -> ()
    where
        T: FnOnce(&str) -> () + panic::UnwindSafe,
    {
        let test_yaml_file = temp_yaml_file_path();

        let test_path = test_yaml_file.clone();
        let result = panic::catch_unwind(move || test(&test_path));

        remove_file(test_yaml_file).unwrap();

        assert!(result.is_ok())
    }

    fn temp_yaml_file_path() -> String {
        let mut temp_dir = env::temp_dir();

        let thread_id = thread::current().id();
        temp_dir.push(format!("test_node_endpoint-{:?}.yaml", thread_id));
        temp_dir.to_str().unwrap().to_string()
    }
}
