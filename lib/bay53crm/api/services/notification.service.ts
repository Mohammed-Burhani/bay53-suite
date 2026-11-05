// ==================== CRM Notification API ====================
// Mirrors the "Notification" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmNotification, CrmNotificationList, CrmUserNotificationList } from "../dto";
import type { CrmSchemas as S } from "../types";

export const notificationApi = {
  list: <T = CrmNotificationList>(payload: S["NotificationsSearchParams"]) =>
    crmHttp.post<T>("/Notification/List", payload),
  get: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Notification/Get", id),
  add: <T = unknown>(payload: S["NotificationCreateViewModel"]) =>
    crmHttp.post<T>("/Notification/Add", payload),
  update: <T = unknown>(payload: S["NotificationCreateViewModel"]) =>
    crmHttp.post<T>("/Notification/Update", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Notification/Delete", id),
  activeList: <T = CrmNotification[]>() =>
    crmHttp.post<T>("/Notification/ActiveList"),
  addStaticUser: <T = unknown>(payload: S["UsersToNotificationsCreateViewModel"][]) =>
    crmHttp.post<T>("/Notification/AddStaticUser", payload),
  removeStaticUser: <T = unknown>(payload: S["NotificationCheckViewModel"]) =>
    crmHttp.post<T>("/Notification/RemoveStaticUser", payload),
  addSuppression: <T = unknown>(payload: S["NotificationSuppressionCreateViewModel"][]) =>
    crmHttp.post<T>("/Notification/AddSuppression", payload),
  removeSuppression: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Notification/RemoveSuppression", id),
  updateSuppression: <T = unknown>(payload: S["NotificationSuppressionCreateViewModel"]) =>
    crmHttp.post<T>("/Notification/UpdateSuppression", payload),
  userNotificationList: <T = CrmUserNotificationList>(payload: S["UserNotificationsSearchParams"]) =>
    crmHttp.post<T>("/Notification/UserNotificationList", payload),
  markReadNotification: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Notification/MarkReadNotification", id),
  allUserNotificationList: <T = CrmUserNotificationList>(payload: S["UserNotificationsSearchParams"]) =>
    crmHttp.post<T>("/Notification/AllUserNotificationList", payload),
  deleteUserNotification: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Notification/DeleteUserNotification", id),
};
