import { getToken } from "./messaging";
import { BACKEND_BASE_URL } from "./constants";

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
  headers?: HeadersInit
): Promise<Response> {
  let tok: string = "";
  try {
    tok = await getToken();
  } catch (e) {}

  headers = {
    Accept: "application/json",
    ...headers,
  };
  if (tok) {
    headers = { Authorization: `Token ${tok}`, ...headers };
  }
  const uri = BACKEND_BASE_URL + route;
  return fetch(uri, {
    method,
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Send log message with optional additional context to the backend, like
 * a json blob or a dump of the DOM content.
 */
export async function logToBackend(
  msg: string,
  json?: object,
  dumpDom: boolean = false
): Promise<void> {
  const payload: { [k: string]: string | object } = {
    message: msg,
  };
  if (json) {
    payload.extra_data = json;
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
