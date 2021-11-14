import { getTokenMsg } from "./messaging";
import { BACKEND_BASE_URL } from "./constants";
import { serializeError } from "serialize-error";
import { JsonObject } from "type-fest";
import { inBackgroundScript, fetchToken } from "./background";

export type SubmissionResource = {
  pk: number;
  api_student_profile_id: string;
  api_student_submission_id: string;
  submission: Array<string>;
  student_name: string;
  grade: number;
  comment: string;
};

export type GradingSessionDetailResponse = {
  session: {
    pk: number;
    api_assignment_id: string;
    max_grade: number;
    teacher_template: string;
    average_grade: number;
    google_classroom_detail_view_url: string;
    submissions: Array<SubmissionResource>;
  };
};

export async function backendRequest(
  route: string,
  method: string = "GET",
  data?: object,
  headers: Record<string, string> = {}
): Promise<Response> {
  headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...headers,
  };

  if (!headers.Authorization) {
    // try to get a token
    try {
      let tok: string;
      if (inBackgroundScript()) {
        // if this is being called from a background script context, we don't
        // need to send a message to ourselves, we can just get the token
        // directly
        tok = await fetchToken();
      } else {
        // otherwise, send a message to the background script to get the
        // token
        tok = await getTokenMsg();
      }
      if (tok && tok.length) {
        headers = { Authorization: `Token ${tok}`, ...headers };
      }
    } catch (e) {
      console.error(e);
    }
  }

  const uri = BACKEND_BASE_URL + route;

  if (data && method !== "GET") {
    return fetch(uri, {
      method,
      headers,
      body: JSON.stringify(data),
    });
  } else {
    return fetch(uri, {
      method,
      headers,
    });
  }
}

/**
 * Send log message with optional additional context to the backend, like
 * a json blob or a dump of the DOM content.
 */
export async function logToBackend(
  msg: string,
  json?: JsonObject,
  error?: Error,
  dumpDom: boolean = false
): Promise<void> {
  console.error("logging error: ", error);
  type Payload = {
    message: string;
    extra_data?: JsonObject;
    dom_dump?: string;
  };
  const payload: Payload = {
    message: msg,
  };
  if (json) {
    payload.extra_data = json;
  }
  if (error) {
    const serialized = serializeError(error);
    payload.extra_data = { ...payload.extra_data, ...serialized };
  }
  if (dumpDom) {
    payload.dom_dump = `<html>${document.head.outerHTML}${document.body.outerHTML}`;
  }
  try {
    await backendRequest("/ext/log_error/", "POST", payload);
  } finally {
    // just cry; there's nothing more we can do
  }
}
