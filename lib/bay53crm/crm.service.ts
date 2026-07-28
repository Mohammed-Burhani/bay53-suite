import type {
  CRMLead,
  CRMFollowUp,
  CRMProject,
  MasterLookupItem,
  MasterLookupType,
  CRMNotification,
  CRMCompanyConfig,
} from "./types";
import * as data from "./data";

// ==================== Lead Service ====================

export const crmLeadService = {
  async getAll(): Promise<CRMLead[]> {
    return data.getLeads();
  },

  async getById(id: string): Promise<CRMLead | undefined> {
    return data.getLeadById(id);
  },

  async create(leadData: Omit<CRMLead, "id" | "createdAt" | "updatedAt">): Promise<CRMLead> {
    return data.createLead(leadData);
  },

  async update(id: string, updates: Partial<CRMLead>): Promise<CRMLead | null> {
    return data.updateLead(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return data.deleteLead(id);
  },
};

// ==================== FollowUp Service ====================

export const crmFollowUpService = {
  async getByLeadId(leadId: string): Promise<CRMFollowUp[]> {
    return data.getFollowUps(leadId);
  },

  async getByProjectId(projectId: string): Promise<CRMFollowUp[]> {
    return data.getFollowUps(undefined, projectId);
  },

  async add(followUp: Omit<CRMFollowUp, "id">): Promise<CRMFollowUp> {
    return data.addFollowUp(followUp);
  },
};

// ==================== Project Service ====================

export const crmProjectService = {
  async getAll(): Promise<CRMProject[]> {
    return data.getProjects();
  },

  async getById(id: string): Promise<CRMProject | undefined> {
    return data.getProjectById(id);
  },

  async create(projData: Omit<CRMProject, "id" | "createdAt" | "updatedAt">): Promise<CRMProject> {
    return data.createProject(projData);
  },

  async update(id: string, updates: Partial<CRMProject>): Promise<CRMProject | null> {
    return data.updateProject(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return data.deleteProject(id);
  },
};

// ==================== Master Values Service ====================

export const crmMasterService = {
  async getAll(type?: string): Promise<ReturnType<typeof data.getMasterValues>> {
    return data.getMasterValues(type as any);
  },

  async add(item: Omit<import("./types").MasterLookupItem, "id">): Promise<import("./types").MasterLookupItem> {
    return data.addMasterValue(item);
  },

  async update(id: string, updates: Partial<import("./types").MasterLookupItem>): Promise<import("./types").MasterLookupItem | null> {
    return data.updateMasterValue(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return data.deleteMasterValue(id);
  },
};

// ==================== Notification Service ====================

export const crmNotificationService = {
  async getAll(): Promise<import("./types").CRMNotification[]> {
    return data.getNotifications();
  },

  async add(notif: Omit<import("./types").CRMNotification, "id" | "createdAt">): Promise<import("./types").CRMNotification> {
    return data.addNotification(notif);
  },

  async update(id: string, updates: Partial<import("./types").CRMNotification>): Promise<import("./types").CRMNotification | null> {
    return data.updateNotification(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return data.deleteNotification(id);
  },
};

// ==================== Company Config Service ====================

export const crmCompanyService = {
  async get(): Promise<import("./types").CRMCompanyConfig | null> {
    return data.getCompanyConfig();
  },

  async update(updates: Partial<import("./types").CRMCompanyConfig>): Promise<import("./types").CRMCompanyConfig> {
    return data.updateCompanyConfig(updates);
  },
};

// ==================== Dashboard Service ====================

export const crmDashboardService = {
  async getLeadsByStage(leads: CRMLead[]) {
    return data.getLeadsByStage(leads);
  },

  async getLeadsBySource(leads: CRMLead[]) {
    return data.getLeadsBySource(leads);
  },
};
