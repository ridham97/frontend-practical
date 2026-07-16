// Runs on WhatsApp Web. If the background has a pending job for this tab, it
// waits for the chat to open, attaches the PDF (three mechanisms, in order:
// the attach menu's file slot, drag-and-drop onto the chat, paste), fills the
// caption and sends. Success is only reported after the PDF bubble is
// actually visible in the conversation.
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

  const captionBox = () =>
    [...document.querySelectorAll('div[contenteditable="true"]')].find(
      (el) => visible(el) && !el.closest("footer")
    ) || null;

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

  const previewOpen = () => !!(previewSendButton() || captionBox());

  const pressKey = (target, key, keyCode) => {
    const opts = { key, code: key, keyCode, which: keyCode, bubbles: true, cancelable: true };
    target.dispatchEvent(new KeyboardEvent("keydown", opts));
    target.dispatchEvent(new KeyboardEvent("keypress", opts));
    target.dispatchEvent(new KeyboardEvent("keyup", opts));
  };

  const nameStamp = (job.filename || "invitation.pdf").replace(/\.pdf$/i, "").slice(0, 18);
  const pdfBubbleVisible = () => document.body.innerText.includes(nameStamp);

  // Compact fingerprint of the current WhatsApp markup, for precise debugging.
  const fingerprint = () => {
    const icons = [...new Set([...document.querySelectorAll("[data-icon]")].filter(visible).map((el) => el.getAttribute("data-icon")))].slice(0, 18);
    const inputs = [...document.querySelectorAll('input[type="file"]')].map((i) => i.accept || "(any)");
    return `icons: ${icons.join(",") || "none"} | file-inputs: ${inputs.length ? inputs.join(" / ") : "none"}`;
  };

  const banner = document.createElement("div");
  banner.textContent = "Amee ♥ Ridham studio: sending invitation to " + job.phone + "…";
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;background:#233D35;color:#F7F1E5;padding:8px 14px;font:13px sans-serif;text-align:center";
  document.documentElement.appendChild(banner);

  const file = (() => {
    const bytes = Uint8Array.from(atob(job.pdfBase64), (c) => c.charCodeAt(0));
    return new File([bytes], job.filename || "invitation.pdf", { type: "application/pdf" });
  })();

  const makeDT = () => {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt;
  };

  // --- attach mechanism 1: the attach menu's hidden file slot -------------
  const attachViaMenu = async () => {
    const plusSelectors = [
      'span[data-icon="plus"]',
      'span[data-icon="plus-rounded"]',
      'span[data-icon="attach-menu-plus"]',
      'span[data-icon="clip"]',
      'span[data-icon="wds-ic-plus"]',
      'button[aria-label="Attach"]',
      '[data-testid="attach-menu-plus"]',
    ];
    for (const sel of plusSelectors) {
      const icon = document.querySelector(sel);
      const btn = icon && (icon.closest('[role="button"], button') || icon);
      if (btn && visible(btn) && btn.closest("footer")) {
        btn.click();
        break;
      }
    }
    // wait for the menu's file inputs to exist
    const input = await waitFor(() => {
      const inputs = [...document.querySelectorAll('input[type="file"]')];
      return (
        inputs.find((i) => (i.accept || "").trim() === "*" || (i.accept || "").trim() === "") ||
        inputs.find((i) => (i.accept || "").includes("application") || (i.accept || "").includes("pdf")) ||
        inputs.find((i) => !/image|video/.test(i.accept || "")) ||
        null
      );
    }, 5000, 300);
    if (!input) {
      document.body && pressKey(document.body, "Escape", 27); // close the menu again
      return false;
    }
    input.files = makeDT().files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  // --- attach mechanism 2: drag-and-drop the PDF onto the conversation ----
  const attachViaDrop = async () => {
    const target =
      document.querySelector("#main") ||
      document.querySelector('footer div[contenteditable="true"]')?.closest("#main, main, div") ||
      document.body;
    for (const type of ["dragenter", "dragover", "drop"]) {
      const ev = new DragEvent(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, "dataTransfer", { value: makeDT() });
      target.dispatchEvent(ev);
      await sleep(250);
    }
    return true;
  };

  // --- attach mechanism 3: paste into the composer -------------------------
  const attachViaPaste = async () => {
    const composer = document.querySelector('footer div[contenteditable="true"]');
    if (!composer) return false;
    composer.focus();
    const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: makeDT() });
    composer.dispatchEvent(paste);
    return true;
  };

  try {
    // 1. Wait for the conversation composer (chat open + logged in).
    const composerReady = await waitFor(
      () => document.querySelector('footer div[contenteditable="true"]'),
      120000,
      600
    );
    if (!composerReady) throw new Error("WhatsApp chat did not open. Make sure WhatsApp Web is logged in.");
    await sleep(1800);

    // 2. Try each attach mechanism until the preview opens.
    const methods = [
      ["attach menu", attachViaMenu],
      ["drag and drop", attachViaDrop],
      ["paste", attachViaPaste],
    ];
    let opened = false;
    let used = "";
    for (const [name, method] of methods) {
      banner.textContent = `Amee ♥ Ridham studio: attaching PDF (${name})…`;
      const did = await method();
      if (did && (await waitFor(() => (previewOpen() ? true : null), 8000, 400))) {
        opened = true;
        used = name;
        break;
      }
      pressKey(document.body, "Escape", 27);
      await sleep(600);
    }
    if (!opened) {
      throw new Error("Could not attach the PDF with any method. Nothing was sent. [" + fingerprint() + "]");
    }
    await sleep(900);

    // 3. Type the personalized message into the caption box (never the footer).
    const caption = captionBox();
    if (caption && job.message) {
      caption.focus();
      document.execCommand("insertText", false, job.message);
      await sleep(500);
    }

    // 4. Send: click the preview's send button, else press Enter in the caption.
    banner.textContent = "Amee ♥ Ridham studio: sending (attached via " + used + ")…";
    const btn = previewSendButton();
    if (btn) btn.click();
    else pressKey(caption || document.activeElement, "Enter", 13);
    await sleep(2500);
    if (previewSendButton()) {
      pressKey(captionBox() || document.activeElement, "Enter", 13);
      await sleep(2000);
    }
    if (previewSendButton()) {
      throw new Error("The attachment preview did not close after pressing send. [" + fingerprint() + "]");
    }

    // 5. Hard verification: the PDF bubble must be visible in the chat.
    const delivered = await waitFor(() => (pdfBubbleVisible() ? true : null), 20000, 800);
    if (!delivered) {
      throw new Error("WhatsApp did not show the sent PDF in the chat. Check the tab. [" + fingerprint() + "]");
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
