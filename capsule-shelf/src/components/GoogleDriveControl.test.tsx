import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleDriveControl } from "./GoogleDriveControl";

const labels = {
  connect: "Подключить Google Drive",
  reconnect: "Продолжить синхронизацию с Google Drive",
  connecting: "Подключаю Google Drive…",
  saving: "Сохраняю настройки в Google Drive",
  connected: "Google Drive подключён",
  remembered: "Google Drive запомнен; нажми, чтобы продолжить",
  error: "Не удалось синхронизировать с Google Drive",
  popover: "Состояние Google Drive",
  disconnect: "Отключить Google Drive",
};

describe("GoogleDriveControl", () => {
  afterEach(cleanup);
  it("shows neutral connect control and starts OAuth when clicked", () => {
    const onConnect = vi.fn();
    render(<GoogleDriveControl email={null} onConnect={onConnect} onDisconnect={() => {}} state="disconnected" labels={labels} />);

    const button = screen.getByRole("button", { name: labels.connect });
    expect(button).toHaveAttribute("data-state", "disconnected");
    fireEvent.click(button);
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it("shows a green linked state and opens a disconnect popover", () => {
    render(<GoogleDriveControl email="user@example.com" onConnect={() => {}} onDisconnect={() => {}} state="connected" labels={labels} />);

    const button = screen.getByRole("button", { name: labels.connected });
    expect(button).toHaveAttribute("data-state", "connected");
    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: labels.popover })).toHaveTextContent("user@example.com");
    expect(screen.getByRole("button", { name: labels.disconnect })).toBeInTheDocument();
  });

  it("closes the disconnect popover on Escape and returns focus to the control", () => {
    render(<GoogleDriveControl email="user@example.com" onConnect={() => {}} onDisconnect={() => {}} state="connected" labels={labels} />);
    const button = screen.getByRole("button", { name: labels.connected });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: labels.popover })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("announces saving with an animated sync state and no account email", () => {
    render(<GoogleDriveControl email="user@example.com" onConnect={() => {}} onDisconnect={() => {}} state="saving" labels={labels} />);
    const button = screen.getByRole("button", { name: labels.saving });
    expect(button).toHaveAttribute("data-state", "saving");
    expect(button).not.toHaveTextContent("user@example.com");
  });
});
