const disclosureEvent = "lunacea:header-disclosure";

export function announceHeaderDisclosure(id: string): void {
  if (typeof document === "undefined") return;
  globalThis.dispatchEvent(new CustomEvent(disclosureEvent, { detail: id }));
}

export function listenForHeaderDisclosure(id: string, close: () => void): () => void {
  const listener = (event: Event) => {
    if ((event as CustomEvent<string>).detail !== id) close();
  };
  globalThis.addEventListener(disclosureEvent, listener);
  return () => globalThis.removeEventListener(disclosureEvent, listener);
}
