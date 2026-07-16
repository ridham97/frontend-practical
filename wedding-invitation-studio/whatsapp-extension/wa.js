// Runs on WhatsApp Web. If the background has a pending job for this tab, it
// waits for the chat to open, attaches the PDF through WhatsApp's own file
// input (the same one the + attach button uses), fills the caption and sends.
// Success is only reported after the PDF bubble is actually visible in the
// conversation, so a text-only send can never be mistaken for success.
(async () => {
  const job = await new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: "arwa_get_job" }, (res) => {
      void chrome.runtime.lastError;
      resolve(res || null);
    })
  );
  if (!job) return; // normal WhatsApp browsing, stay inert

  const report = (ok, error) =>
    chrome.runtime.sendMessage({ type: "arwa_done", ok, error }, () => void chrome.runtime.lastError);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = async (finder, timeoutMs, stepMs = 400) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const el = finder();
        if (el) return el;
      } catch (e) {}
      await sleep(stepMs);
    }
    return null;
  };

  const visible = (el) => !!el && el.offsetParent !== null;

  // Editable boxes OUTSIDE the footer = the attachment preview's caption box.
  // (The footer composer re-renders constantly, so never compare node identity.)
  const captionBox = () =>
    [...document.querySelectorAll('div[contenteditable="true"]')].find(
      (el) => visible(el) && !el.closest("footer") && !el.closest('[data-testid="chat-list-search"]')
    ) || null;

  // Send control that belongs to the attachment preview (not the footer).
  const previewSendButton = () => {
    const selectors = [
      'span[data-icon="send"]',
      'span[data-icon="wds-ic-send-filled"]',
      'span[data-icon="wds-ic-send"]',
      'span[data-icon*="send"]',
      '[data-testid="send"]',
      'button[aria-label="Send"]',
      'div[role="button"][aria-label="Send"]',
    ];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const btn = el.closest('[role="button"], button') || el;
        if (visible(btn) && !btn.closest("footer")) return btn;
      }
    }
    return null;
  };

  const pressEnter = (target) => {
    const opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
    target.dispatchEvent(new KeyboardEvent("keydown", opts));
    target.dispatchEvent(new KeyboardEvent("keypress", opts));
    target.dispatchEvent(new KeyboardEvent("keyup", opts));
  };

  // The PDF bubble shows the file name; look for its first characters in the
  // chat once the preview closes. Works even when the name is truncated.
  const nameStamp = (job.filename || "invitation.pdf").replace(/\.pdf$/i, "").slice(0, 18);
  const pdfBubbleVisible = () => document.body.innerText.includes(nameStamp);

  const banner = document.createElement("div");
  banner.textContent = "Amee ♥ Ridham studio: sending invitation to " + job.phone + "…";
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;background:#233D35;color:#F7F1E5;padding:8px 14px;font:13px sans-serif;text-align:center";
  document.documentElement.appendChild(banner);

  try {
    // 1. Wait for the conversation composer (chat open + logged in).
    const composerReady = await waitFor(
      () => document.querySelector('footer div[contenteditable="true"]'),
      120000,
      600
    );
    if (!composerReady) throw new Error("WhatsApp chat did not open. Make sure WhatsApp Web is logged in.");
    await sleep(1800);

    const bytes = Uint8Array.from(atob(job.pdfBase64), (c) => c.charCodeAt(0));
    const file = new File([bytes], job.filename || "invitation.pdf", { type: "application/pdf" });

    // 2. Attach through WhatsApp's own file input. Open the + attach menu
    //    first so the inputs exist, then pick the document input (accepts *).
    const plusSelectors = [
      'span[data-icon="plus"]',
      'span[data-icon="attach-menu-plus"]',
      'span[data-icon="clip"]',
      'span[data-icon="wds-ic-plus"]',
      'button[aria-label="Attach"]',
      '[data-testid="attach-menu-plus"]',
    ];
    let attached = false;
    for (let attempt = 0; attempt < 2 && !attached; attempt++) {
      for (const sel of plusSelectors) {
        const icon = document.querySelector(sel);
        const btn = icon && (icon.closest('[role="button"], button') || icon);
        if (btn && visible(btn)) {
          btn.click();
          await sleep(900);
          break;
        }
      }
      const inputs = [...document.querySelectorAll('input[type="file"]')];
      const docInput =
        inputs.find((i) => (i.accept || "").trim() === "*" || (i.accept || "").trim() === "") ||
        inputs.find((i) => (i.accept || "").includes("application")) ||
        inputs.find((i) => !/image|video/.test(i.accept || "")) ||
        inputs[0];
      if (docInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        docInput.files = dt.files;
        docInput.dispatchEvent(new Event("change", { bubbles: true }));
        attached = true;
      } else {
        await sleep(800);
      }
    }

    // 2b. Fallback: synthetic paste into the composer.
    if (!attached) {
      const composer = document.querySelector('footer div[contenteditable="true"]');
      const dt = new DataTransfer();
      dt.items.add(file);
      composer.focus();
      const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(paste, "clipboardData", { value: dt });
      composer.dispatchEvent(paste);
    }

    // 3. Wait for the attachment preview: a caption box or send control
    //    OUTSIDE the footer. If neither appears, the attach failed - stop
    //    here so nothing text-only gets sent by mistake.
    const preview = await waitFor(() => previewSendButton() || captionBox(), 30000);
    if (!preview) {
      throw new Error("Could not attach the PDF (the preview never opened). Nothing was sent. Please try once more.");
    }
    await sleep(900);

    // 4. Type the personalized message into the caption box (never the footer).
    const caption = captionBox();
    if (caption && job.message) {
      caption.focus();
      document.execCommand("insertText", false, job.message);
      await sleep(500);
    }

    // 5. Send: click the preview's send button, else press Enter in the caption.
    const btn = previewSendButton();
    if (btn) btn.click();
    else pressEnter(caption || document.activeElement);
    await sleep(2500);
    if (previewSendButton()) {
      pressEnter(captionBox() || document.activeElement);
      await sleep(2000);
    }

    // 6. Hard verification: the PDF bubble (file name) must be visible in the
    //    conversation. Without this, never report success.
    const delivered = await waitFor(() => (pdfBubbleVisible() && !previewSendButton() ? true : null), 20000, 800);
    if (!delivered) {
      throw new Error("WhatsApp did not show the sent PDF in the chat. Please check the tab and send it manually if needed.");
    }

    banner.textContent = "Invitation PDF sent ✓ — this tab will close by itself.";
    banner.style.background = "#1F7A53";
    report(true);
  } catch (err) {
    banner.textContent = "Could not send automatically: " + (err && err.message ? err.message : err);
    banner.style.background = "#A44A3F";
    report(false, err && err.message ? err.message : String(err));
  }
})();
