/**
 * Copyright 2019 Cargill Incorporated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { registerConfigSapling, getUser, registerApp, setUser } from "canopyjs";
import { createBrowserHistory } from "history";

const history = createBrowserHistory();

interface FormEventHandler {
  (this: HTMLFormElement, event: Event): void;
}

registerConfigSapling("login", () => {
  const canopy_user = window.sessionStorage.getItem("canopy_user");

  if (!getUser() && canopy_user) {
    setUser(JSON.parse(canopy_user));
    return;
  }

  if (!getUser()) {
    const canopyUrl = new URL(window.location as any);
    canopyUrl.pathname =
      canopyUrl.pathname === "/login" ? "/" : canopyUrl.pathname;
    console.log(canopyUrl);

    const { href } = canopyUrl;
    history.push("/login");
    registerApp(domNode => {
      function formSumbitEventToFormData(event: Event) {
        event.preventDefault();
        return new FormData(event.target as HTMLFormElement);
      }

      function createFormActionCapture(
        action: "register" | "login"
      ): FormEventHandler {
        return function captureForm(this: HTMLFormElement, event: Event) {
          const formData = formSumbitEventToFormData(event);
          console.log({ formData, action });

          const user = {
            displayName: formData.get("username") as string,
            userId: "ff00aa"
          };

          window.sessionStorage.setItem("canopy_user", JSON.stringify(user));

          const formParent = (event.target as HTMLFormElement)
            .parentNode as HTMLDivElement;

          //Simulate some wait time based
          let progress = 0;
          const time = 10000;
          function doProgress() {
            progress += time / 1000;
            formParent.innerHTML = `<progress style="font-size: 3rem" max="${time /
              2}" value="${progress % time}"/>`;
            window.requestAnimationFrame(doProgress);
          }
          doProgress();

          setTimeout(() => {
            setUser(user);
            domNode.innerHTML = "";
            window.location.href = href;
          }, time);
        };
      }

      const handleRegisterEvent = createFormActionCapture("register");
      const handleLoginEvent = createFormActionCapture("login");

      const registerForm = document.createElement("form");
      registerForm.addEventListener("submit", handleRegisterEvent);

      const loginForm = document.createElement("form");
      loginForm.addEventListener("submit", handleLoginEvent);

      registerForm.innerHTML = `<h1>Register</h1><input type='text' name='username'/><input type='password' name='password'/><button type='submit'>Register</button>`;
      loginForm.innerHTML = `<h1>Login</h1><input type='text' name='username'/><input type='password' name='password'/><button type='submit'>Login</button>`;

      domNode.insertAdjacentElement("beforeend", registerForm);
      domNode.insertAdjacentElement("beforeend", loginForm);
    });
  }
});
