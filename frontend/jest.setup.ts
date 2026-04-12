import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/",
  notFound: jest.fn(),
}));

jest.mock("@auth0/nextjs-auth0", () => ({
  getAccessToken: jest.fn().mockResolvedValue({
    accessToken: "mock-token",
  }),
  useUser: jest.fn().mockReturnValue({
    user: null,
    isLoading: false,
  }),
}));
