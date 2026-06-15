import type React from "react";

export async function startWindowDrag(event: React.MouseEvent<HTMLDivElement>) {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement;
  if (target.closest("button, input, select, textarea, a")) return;

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch (error) {
    console.warn("Window drag is only available inside Tauri.", error);
  }
}

export async function lockWindowWidth() {
  try {
    const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setSizeConstraints({
      minWidth: 900,
      maxWidth: 900,
      minHeight: 720,
      maxHeight: 1100,
    });
    await getCurrentWindow().setSize(new LogicalSize(900, 980));
  } catch (error) {
    console.warn("Window sizing is only available inside Tauri.", error);
  }
}
