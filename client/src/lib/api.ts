import type {
  Club,
  CollectionItem,
  CollectionTotalResponse,
  CreateClubPayload,
  CreateCollectionPayload,
  CreateExpensePayload,
  ExpenseItem,
  ExpenseTotalResponse,
  Member,
  User,
} from "../types";

const API_BASE = "";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem("echanda_token");
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  try {
    localStorage.setItem("echanda_token", token);
    localStorage.setItem("echanda_user", JSON.stringify(user));
  } catch (e) {
    console.error("Failed to persist auth", e);
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem("echanda_token");
    localStorage.removeItem("echanda_user");
  } catch (e) {
    console.error("Failed to clear auth", e);
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("echanda_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    let message = "An unexpected error occurred";
    if (data && typeof data === "object") {
      message = data.error || data.message || JSON.stringify(data);
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    if (res.status === 401) {
      // Token might be expired or invalid
      // Only clear if we actually had a stored token to prevent loops
      if (token) {
        clearStoredAuth();
        window.dispatchEvent(new Event("echanda:unauthorized"));
      }
    }

    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(data: { name: string; phone_number: string; password: string }) {
      return request<User>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async login(data: { phone_number: string; password: string }) {
      const response = await request<{ message: string; token: string; user: User }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (response.token && response.user) {
        setStoredAuth(response.token, response.user);
      }
      return response;
    },

    async logout() {
      try {
        await request<{ message: string }>("/api/v1/auth/logout", {
          method: "POST",
        });
      } finally {
        clearStoredAuth();
      }
    },
  },

  clubs: {
    async getAll() {
      return request<Club[]>("/api/v1/clubs/");
    },

    async getJoinedClubs() {
      return request<Club[]>("/api/v1/clubs/joined");
    },

    async getById(clubId: string) {
      return request<Club>(`/api/v1/clubs/${clubId}`);
    },

    async create(data: CreateClubPayload) {
      return request<Club>("/api/v1/clubs/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async join(clubId: string) {
      return request<{ message: string; club_name?: string }>(`/api/v1/clubs/${clubId}/join`, {
        method: "POST",
      });
    },

    async getMembers(clubId: string) {
      return request<Member[]>(`/api/v1/clubs/${clubId}/members`);
    },

    async updateMemberRole(clubId: string, userId: string, role: "collector" | "viewer") {
      return request<{ message: string; membership_id: string; role: string }>(
        `/api/v1/clubs/${clubId}/members/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        }
      );
    },

    async promoteMember(clubId: string, userId: string) {
      return this.updateMemberRole(clubId, userId, "collector");
    },

    async demoteMember(clubId: string, userId: string) {
      return this.updateMemberRole(clubId, userId, "viewer");
    },
  },

  collections: {
    async getAll(clubId: string) {
      return request<CollectionItem[]>(`/api/v1/clubs/${clubId}/collections/`);
    },

    async create(clubId: string, data: CreateCollectionPayload) {
      return request<CollectionItem>(`/api/v1/clubs/${clubId}/collections/`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(clubId: string, collectionId: string, data: CreateCollectionPayload) {
      return request<CollectionItem>(`/api/v1/clubs/${clubId}/collections/${collectionId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async getTotal(clubId: string) {
      return request<CollectionTotalResponse>(`/api/v1/clubs/${clubId}/collections/total`);
    },
  },

  expenses: {
    async getAll(clubId: string) {
      return request<ExpenseItem[]>(`/api/v1/clubs/${clubId}/expenses/`);
    },

    async create(clubId: string, data: CreateExpensePayload) {
      return request<ExpenseItem>(`/api/v1/clubs/${clubId}/expenses/`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(clubId: string, expenseId: string, data: CreateExpensePayload) {
      return request<ExpenseItem>(`/api/v1/clubs/${clubId}/expenses/${expenseId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async getTotal(clubId: string) {
      return request<ExpenseTotalResponse>(`/api/v1/clubs/${clubId}/expenses/total`);
    },
  },
};
