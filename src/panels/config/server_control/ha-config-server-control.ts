import "@material/mwc-button";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { componentsWithService } from "../../../common/config/components_with_service";
import "../../../components/buttons/ha-call-service-button";
import "../../../components/ha-card";
import { checkCoreConfig } from "../../../data/core";
import { domainToName } from "../../../data/integration";
import "../../../layouts/hass-subpage";
import "../../../layouts/hass-tabs-subpage";
import { haStyle } from "../../../resources/styles";
import { HomeAssistant, Route } from "../../../types";
import "../ha-config-section";

@customElement("ha-config-server-control")
export class HaConfigServerControl extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public isWide!: boolean;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public showAdvanced!: boolean;

  @state() private _validating = false;

  @state() private _reloadableDomains: string[] = [];

  private _validateLog = "";

  private _isValid: boolean | null = null;

  protected updated(changedProperties) {
    const oldHass = changedProperties.get("hass");
    if (
      changedProperties.has("hass") &&
      (!oldHass || oldHass.config.components !== this.hass.config.components)
    ) {
      this._reloadableDomains = componentsWithService(
        this.hass,
        "reload"
      ).sort();
    }
  }

  protected render(): TemplateResult {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/config/system"
        .showAdvanced=${this.showAdvanced}
        .header=${this.hass.localize("ui.panel.config.server_control.caption")}
      >
        <div class="content">
          ${this.showAdvanced
            ? html`
                <ha-card
                  outlined
                  header=${this.hass.localize(
                    "ui.panel.config.server_control.section.validation.heading"
                  )}
                >
                  <div class="card-content">
                    ${this.hass.localize(
                      "ui.panel.config.server_control.section.validation.introduction"
                    )}
                    ${!this._validateLog
                      ? html`
                          <div
                            class="validate-container layout vertical center-center"
                          >
                            ${!this._validating
                              ? html`
                                  ${this._isValid
                                    ? html` <div
                                        class="validate-result"
                                        id="result"
                                      >
                                        ${this.hass.localize(
                                          "ui.panel.config.server_control.section.validation.valid"
                                        )}
                                      </div>`
                                    : ""}
                                  <mwc-button
                                    raised
                                    @click=${this._validateConfig}
                                  >
                                    ${this.hass.localize(
                                      "ui.panel.config.server_control.section.validation.check_config"
                                    )}
                                  </mwc-button>
                                `
                              : html`
                                  <ha-circular-progress
                                    active
                                  ></ha-circular-progress>
                                `}
                          </div>
                        `
                      : html`
                          <div class="config-invalid">
                            <span class="text">
                              ${this.hass.localize(
                                "ui.panel.config.server_control.section.validation.invalid"
                              )}
                            </span>
                            <mwc-button raised @click=${this._validateConfig}>
                              ${this.hass.localize(
                                "ui.panel.config.server_control.section.validation.check_config"
                              )}
                            </mwc-button>
                          </div>
                          <div id="configLog" class="validate-log">
                            ${this._validateLog}
                          </div>
                        `}
                  </div>
                </ha-card>
              `
            : ""}

          <ha-card
            outlined
            header=${this.hass.localize(
              "ui.panel.config.server_control.section.server_management.heading"
            )}
          >
            <div class="card-content">
              ${this.hass.localize(
                "ui.panel.config.server_control.section.server_management.introduction"
              )}
            </div>
            <div class="card-actions warning">
              <ha-call-service-button
                class="warning"
                .hass=${this.hass}
                domain="homeassistant"
                service="restart"
                .confirmation=${this.hass.localize(
                  "ui.panel.config.server_control.section.server_management.confirm_restart"
                )}
                >${this.hass.localize(
                  "ui.panel.config.server_control.section.server_management.restart"
                )}
              </ha-call-service-button>
            </div>
          </ha-card>

          ${this.showAdvanced
            ? html`
                <ha-card
                  outlined
                  header=${this.hass.localize(
                    "ui.panel.config.server_control.section.reloading.heading"
                  )}
                >
                  <div class="card-content">
                    ${this.hass.localize(
                      "ui.panel.config.server_control.section.reloading.introduction"
                    )}
                  </div>
                  <div class="card-actions">
                    <ha-call-service-button
                      .hass=${this.hass}
                      domain="homeassistant"
                      service="reload_core_config"
                      >${this.hass.localize(
                        "ui.panel.config.server_control.section.reloading.core"
                      )}
                    </ha-call-service-button>
                  </div>
                  ${this._reloadableDomains.map(
                    (domain) =>
                      html`
                        <div class="card-actions">
                          <ha-call-service-button
                            .hass=${this.hass}
                            .domain=${domain}
                            service="reload"
                            >${this.hass.localize(
                              `ui.panel.config.server_control.section.reloading.${domain}`
                            ) ||
                            this.hass.localize(
                              "ui.panel.config.server_control.section.reloading.reload",
                              "domain",
                              domainToName(this.hass.localize, domain)
                            )}
                          </ha-call-service-button>
                        </div>
                      `
                  )}
                </ha-card>
              `
            : ""}
        </div>
      </hass-subpage>
    `;
  }

  private async _validateConfig() {
    this._validating = true;
    this._validateLog = "";
    this._isValid = null;

    const configCheck = await checkCoreConfig(this.hass);
    this._validating = false;
    this._isValid = configCheck.result === "valid";

    if (configCheck.errors) {
      this._validateLog = configCheck.errors;
    }
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        .validate-container {
          height: 140px;
        }

        .validate-result {
          color: var(--success-color);
          font-weight: 500;
          margin-bottom: 1em;
        }

        .config-invalid {
          margin: 1em 0;
        }

        .config-invalid .text {
          color: var(--error-color);
          font-weight: 500;
        }

        .config-invalid mwc-button {
          float: right;
        }

        .validate-log {
          white-space: pre-line;
          direction: ltr;
        }

        .content {
          padding: 28px 20px 0;
          max-width: 1040px;
          margin: 0 auto;
        }

        ha-card {
          margin-top: 24px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-server-control": HaConfigServerControl;
  }
}
