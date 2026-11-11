"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { notificationApi } from "../services/notification.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

// Two kinds of data: notification rules (the admin screen) and the notifications delivered to a user.
export const notificationKeys = {
  all: crmKeys.notification,
  list: (params: S["NotificationsSearchParams"]) => [...crmKeys.notification, "list", params] as const,
  active: [...crmKeys.notification, "active"] as const,
  detail: (id: number) => [...crmKeys.notification, "detail", id] as const,
  user: (params: S["UserNotificationsSearchParams"]) => [...crmKeys.notification, "user", params] as const,
};

export const notificationQueries = {
  list: (params: S["NotificationsSearchParams"]) =>
    queryOptions({
      queryKey: notificationKeys.list(params),
      queryFn: () => notificationApi.list(params),
      staleTime: staleTime.list,
    }),
  active: () =>
    queryOptions({
      queryKey: notificationKeys.active,
      queryFn: () => notificationApi.activeList(),
      staleTime: staleTime.lookup,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: notificationKeys.detail(id),
      queryFn: () => notificationApi.get(id),
      staleTime: staleTime.list,
    }),
  /** Notifications delivered to one user. */
  user: (params: S["UserNotificationsSearchParams"]) =>
    queryOptions({
      queryKey: notificationKeys.user(params),
      queryFn: () => notificationApi.userNotificationList(params),
      staleTime: staleTime.list,
    }),
};

export const useNotifications = (params: S["NotificationsSearchParams"]) => useQuery(notificationQueries.list(params));
export const useActiveNotifications = () => useQuery(notificationQueries.active());
export const useNotification = (id: number | undefined) =>
  useQuery({ ...notificationQueries.detail(id as number), enabled: id !== undefined });
export const useUserNotifications = (params: S["UserNotificationsSearchParams"]) =>
  useQuery(notificationQueries.user(params));

const SELF = [crmKeys.notification];

export const useAddNotification = () =>
  useCrmMutation((rule: S["NotificationCreateViewModel"]) => notificationApi.add(rule), SELF);
export const useUpdateNotification = () =>
  useCrmMutation((rule: S["NotificationCreateViewModel"]) => notificationApi.update(rule), SELF);
// There is no "change some fields of a rule" mutation on purpose: Notification/Get leaves out a rule's sqlText and
// recipients, so an update built from it would erase them. Send a full NotificationCreateViewModel to useUpdateNotification.
export const useDeleteNotification = () => useCrmMutation((id: number) => notificationApi.delete(id), SELF);

export const useAddNotificationStaticUsers = () =>
  useCrmMutation((users: S["UsersToNotificationsCreateViewModel"][]) => notificationApi.addStaticUser(users), SELF);
export const useRemoveNotificationStaticUser = () =>
  useCrmMutation((user: S["NotificationCheckViewModel"]) => notificationApi.removeStaticUser(user), SELF);
export const useAddNotificationSuppressions = () =>
  useCrmMutation(
    (items: S["NotificationSuppressionCreateViewModel"][]) => notificationApi.addSuppression(items),
    SELF
  );
export const useUpdateNotificationSuppression = () =>
  useCrmMutation((item: S["NotificationSuppressionCreateViewModel"]) => notificationApi.updateSuppression(item), SELF);
export const useRemoveNotificationSuppression = () =>
  useCrmMutation((id: number) => notificationApi.removeSuppression(id), SELF);

export const useMarkNotificationRead = () =>
  useCrmMutation((id: number) => notificationApi.markReadNotification(id), SELF);
export const useDeleteUserNotification = () =>
  useCrmMutation((id: number) => notificationApi.deleteUserNotification(id), SELF);
