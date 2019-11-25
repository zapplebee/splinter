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
      domNode.innerHTML = `<div style="padding: 3rem"><div class="tab-box">
      <div class="tab-box-options" role="tablist" aria-label="login-or-register">
        <button
          class="tab-box-option"
          role="tab"
          aria-selected="true"
          aria-controls="login-panel"
          id="login-panel-tab"
          tabindex="0"
        >
          Login
        </button>
        <button
          class="tab-box-option"
          role="tab"
          aria-selected="false"
          aria-controls="register-panel"
          id="register-panel-tab"
          tabindex="-1"
        >
          Register
        </button>
      </div>
      <div
        class="tab-box-content"
        id="login-panel"
        role="tabpanel"
        tabindex="0"
        aria-labelledby="login-panel-tab"
      >
        <form id="login-form">
          <h1>Login</h1>
          <input type="text" name="username" /><input
            type="password"
            name="password"
          /><button type="submit">Login</button>
        </form>
      </div>
      <div
        class="tab-box-content"
        id="register-panel"
        role="tabpanel"
        tabindex="0"
        aria-labelledby="register-panel-tab"
        hidden
      >
        <form id="register-form">
          <h1>Register</h1>
          <input type="text" name="username" /><input
            type="password"
            name="password"
          /><button type="submit">Register</button>
        </form>
      </div>
    </div>
    </div>
    `;

      const tabs = Array.from(domNode.querySelectorAll(".tab-box-option"));
      const forms = Array.from(domNode.querySelectorAll("form"));

      const [loginForm, registerForm] = forms;
      const panels = Array.from(domNode.querySelectorAll(".tab-box-content"));

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
          const time = 100000;
          function doProgress() {
            const step = (Math.sin(Date.now() / 500) + 1) / 2;
            formParent.innerHTML = `<progress class='progress' max="${1000}" value="${step *
              1000}"/>`;
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

      registerForm.addEventListener("submit", handleRegisterEvent);

      loginForm.addEventListener("submit", handleLoginEvent);

      forms.forEach(form => {
        form.addEventListener("submit", e => {
          e.preventDefault();
        });
      });

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
          setSelectedTab(index);
        });
      });

      function setSelectedTab(tabIndex) {
        tabs.forEach((tab, i) => {
          const selected = i === tabIndex;
          tab.setAttribute("tabindex", selected ? "0" : "-1");
          tab.setAttribute("aria-selected", selected ? "true" : "false");
          tab.setAttribute(
            "class",
            selected ? "tab-box-option active" : "tab-box-option"
          );
        });

        panels.forEach((panel, i) => {
          if (i === tabIndex) {
            panel.removeAttribute("hidden");
          } else {
            panel.setAttribute("hidden", "true");
          }
        });
      }
    });
  }
});
