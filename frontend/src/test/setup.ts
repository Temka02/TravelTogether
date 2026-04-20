import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Мок для matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Мок для axios
vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...actual,
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  };
});

// Мок для apiClient
vi.mock("@/app/api/client", () => ({
  apiClient: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    getAvatar: vi.fn(),
    uploadAvatar: vi.fn(),
    getTrips: vi.fn(),
    getTripById: vi.fn(),
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
    getTripParticipants: vi.fn(),
    getTripApplications: vi.fn(),
    createApplication: vi.fn(),
    acceptApplication: vi.fn(),
    rejectApplication: vi.fn(),
    getMyApplications: vi.fn(),
    getApplicationsToMyTrips: vi.fn(),
    checkApplication: vi.fn(),
    deleteApplication: vi.fn(),
    getWeather: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
}));

// Моки для методов, которые могут отсутствовать в jsdom
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});
