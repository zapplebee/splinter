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

import { register } from 'canopyjs';
import axios from 'axios';
import { API_URL } from './consts';

interface FormSubmitEvent extends Event {
  target: HTMLFormElement;
}

const form = document.createElement('form');

form.addEventListener('submit', (e: FormSubmitEvent) => {
  e.preventDefault();
  const { target } = e;
  const formData = new FormData(target);
  axios
    .post(API_URL, { message: formData.get('notice') })
    .then(() => {
      // todo implement success action
    })
    .catch(() => {
      // todo implement error action
    })
    .then(() => {
      // finally
      target.reset();
    });
});

form.innerHTML = `<input type='text' name='notice'/><button type='submit'>Submit</button>`;

register(domNode => {
  domNode.appendChild(form);
});
