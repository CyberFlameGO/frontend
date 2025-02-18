import "@material/mwc-list/mwc-list";
import "@material/mwc-list/mwc-list-item";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { canShowPage } from "../../../common/config/can_show_page";
import "../../../components/ha-card";
import "../../../components/ha-icon-next";
import "../../../components/ha-navigation-list";
import type { CloudStatus, CloudStatusLoggedIn } from "../../../data/cloud";
import type { PageNavigation } from "../../../layouts/hass-tabs-subpage";
import type { HomeAssistant } from "../../../types";

@customElement("ha-config-navigation")
class HaConfigNavigation extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public pages!: PageNavigation[];

  protected render(): TemplateResult {
    const pages = this.pages
      .filter((page) =>
        page.path === "#external-app-configuration"
          ? this.hass.auth.external?.config.hasSettingsScreen
          : canShowPage(this.hass, page)
      )
      .map((page) => ({
        ...page,
        name:
          page.name ||
          this.hass.localize(
            `ui.panel.config.dashboard.${page.translationKey}.main`
          ),
        description:
          page.component === "cloud" && (page.info as CloudStatus)
            ? page.info.logged_in
              ? `
                  ${this.hass.localize(
                    "ui.panel.config.cloud.description_login",
                    "email",
                    (page.info as CloudStatusLoggedIn).email
                  )}
                `
              : `
                  ${this.hass.localize(
                    "ui.panel.config.cloud.description_features"
                  )}
                `
            : `
                ${
                  page.description ||
                  this.hass.localize(
                    `ui.panel.config.dashboard.${page.translationKey}.secondary`
                  )
                }
              `,
      }));
    return html`
      <ha-navigation-list
        hasSecondary
        .hass=${this.hass}
        .narrow=${this.narrow}
        .pages=${pages}
        @click=${this._entryClicked}
      ></ha-navigation-list>
    `;
  }

  private _entryClicked(ev) {
    const anchor = ev
      .composedPath()
      .find((n) => (n as HTMLElement).tagName === "A") as
      | HTMLAnchorElement
      | undefined;

    if (anchor?.href?.endsWith("#external-app-configuration")) {
      ev.preventDefault();
      this.hass.auth.external!.fireMessage({
        type: "config_screen/show",
      });
    }
  }

  static styles: CSSResultGroup = css`
    ha-navigation-list {
      --navigation-list-item-title-font-size: 16px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-navigation": HaConfigNavigation;
  }
}
