import { render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import SubscriptionButton from "@/components/SubscriptionButton";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(),
}));

const mockUseFormStatus = jest.mocked(useFormStatus);

describe("SubscriptionButton", () => {
  it("renders the subscription button", () => {
    mockUseFormStatus.mockReturnValue({
      pending: false,
      data: null,
      method: null,
      action: null,
    });

    render(
      <SubscriptionButton label="Upgrade to Pro" />
    );

    expect(
      screen.getByRole("button", {
        name: "Upgrade to Pro",
      })
    ).toBeEnabled();
  });

  it("disables the button while processing", () => {
    mockUseFormStatus.mockReturnValue({
      pending: true,
      data: new FormData(),
      method: "post",
      action: "/subscription",
    });

    render(
      <SubscriptionButton label="Upgrade to Pro" />
    );

    expect(
      screen.getByRole("button")
    ).toBeDisabled();
  });
});