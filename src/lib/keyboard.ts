type ModifierKey = "ctrl" | "alt" | "shift" | "meta";

interface ShortcutConfig {
  combo: string;
  when?: () => boolean;
  preventDefault?: boolean;
  handler: (event: KeyboardEvent) => void;
}

interface ParsedCombo {
  key: string;
  modifiers: Set<ModifierKey>;
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split("+").map((part) => part.trim()).filter(Boolean);
  const modifiers: ModifierKey[] = ["ctrl", "alt", "shift", "meta"];
  const modifierSet = new Set<ModifierKey>();
  let key = "";
  parts.forEach((part) => {
    if (modifiers.includes(part as ModifierKey)) {
      modifierSet.add(part as ModifierKey);
    } else {
      key = part;
    }
  });
  return { key, modifiers: modifierSet };
}

function matchesEvent(event: KeyboardEvent, combo: ParsedCombo) {
  if (combo.modifiers.has("ctrl") !== event.ctrlKey) return false;
  if (combo.modifiers.has("alt") !== event.altKey) return false;
  if (combo.modifiers.has("shift") !== event.shiftKey) return false;
  if (combo.modifiers.has("meta") !== event.metaKey) return false;
  const eventKey = event.key.toLowerCase();
  if (!combo.key) {
    return true;
  }
  return combo.key === eventKey;
}

export function createShortcutHandler(configs: ShortcutConfig[]) {
  const parsed = configs.map((item) => ({
    ...item,
    combo: parseCombo(item.combo),
  }));
  return (event: KeyboardEvent) => {
    for (const item of parsed) {
      if (!matchesEvent(event, item.combo)) continue;
      if (item.when && !item.when()) continue;
      if (item.preventDefault !== false) {
        event.preventDefault();
      }
      item.handler(event);
      break;
    }
  };
}
