import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "../app/contexts/AuthContext";

interface TestWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
  noRouter?: boolean; // новая опция
}

const TestWrapper = ({
  children,
  initialEntries,
  noRouter,
}: TestWrapperProps) => {
  let content = <AuthProvider>{children}</AuthProvider>;
  content = <HelmetProvider>{content}</HelmetProvider>;
  if (!noRouter) {
    content = (
      <MemoryRouter initialEntries={initialEntries}>{content}</MemoryRouter>
    );
  }
  return content;
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
  noRouter?: boolean;
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { initialEntries, noRouter, ...restOptions } = options || {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper initialEntries={initialEntries} noRouter={noRouter}>
        {children}
      </TestWrapper>
    ),
    ...restOptions,
  });
};

export * from "@testing-library/react";
export { customRender as render };
