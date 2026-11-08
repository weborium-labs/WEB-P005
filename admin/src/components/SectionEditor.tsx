import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Add as AddIcon,
  DeleteOutlined as DeleteOutlineIcon,
} from "@mui/icons-material";
import MediaPicker from "./MediaPicker";
import type { Section, SectionImage, SectionItem } from "../types/page";
import { BUTTON_LABELS, SECTION_CONFIG, type SectionConfig } from "./sectionConfig";


interface SectionEditorProps {
  section: Section;
  index: number;
  count: number;
  /** Zod/backend field errors keyed by `content.sections.<index>.<path>`. */
  errors: Record<string, string>;
  onChange: (next: Section) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const ImageField = ({
  value,
  error,
  onChange,
}: {
  value?: SectionImage;
  error?: string;
  onChange: (next: SectionImage | undefined) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        Image
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mt: 0.5 }}>
        {value?.url ? (
          <Box
            component="img"
            src={value.url}
            alt={value.alt || ""}
            sx={{
              width: 88,
              height: 88,
              objectFit: "cover",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        ) : (
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: 1,
              border: "1px dashed",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.disabled",
            }}
          >
            <ImageIcon />
          </Box>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setPickerOpen(true)}>
            {value?.url ? "Replace image" : "Choose image"}
          </Button>
          {value?.url && (
            <Button size="small" color="inherit" onClick={() => onChange(undefined)}>
              Remove
            </Button>
          )}
        </Box>
      </Box>
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
      <MediaPicker
        open={pickerOpen}
        value={value}
        onSelect={(next) => onChange(next ?? undefined)}
        onClose={() => setPickerOpen(false)}
      />
    </Box>
  );
};

const Repeater = ({
  title,
  addLabel,
  items,
  fieldErrors,
  shape,
  onChange,
}: {
  title: string;
  addLabel: string;
  items: SectionItem[];
  fieldErrors: (itemIndex: number, field: string) => string | undefined;
  shape: NonNullable<SectionConfig["items"]>;
  onChange: (next: SectionItem[]) => void;
}) => {
  const update = (index: number, patch: Partial<SectionItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const placeholder = (fallback: string) => shape.title ?? fallback;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onChange([...items, shape.children ? { label: "", children: [] } : {}])}
        >
          {addLabel}
        </Button>
      </Box>

      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Nothing here yet.
        </Typography>
      )}

      {items.map((item, itemIndex) => (
        <Card key={itemIndex} variant="outlined" sx={{ mt: 1, bgcolor: "grey.50" }}>
          <CardContent sx={{ "&:last-child": { pb: 1.5 }, py: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Item {itemIndex + 1}
              </Typography>
              <Box>
                <IconButton
                  size="small"
                  aria-label="Move up"
                  disabled={itemIndex === 0}
                  onClick={() => move(itemIndex, -1)}
                >
                  <ArrowUpwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Move down"
                  disabled={itemIndex === items.length - 1}
                  onClick={() => move(itemIndex, 1)}
                >
                  <ArrowDownwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Remove item"
                  onClick={() => onChange(items.filter((_, i) => i !== itemIndex))}
                >
                  <DeleteOutlineIcon fontSize="inherit" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr" }}>
              {shape.label && (
                <TextField
                  size="small"
                  label={shape.label}
                  value={item.label ?? ""}
                  error={Boolean(fieldErrors(itemIndex, "label"))}
                  helperText={fieldErrors(itemIndex, "label")}
                  onChange={(event) => update(itemIndex, { label: event.target.value })}
                />
              )}
              {shape.title && (
                <TextField
                  size="small"
                  label={shape.title}
                  multiline={shape.title.length > 12}
                  minRows={shape.title.length > 12 ? 2 : 1}
                  value={item.title ?? ""}
                  error={Boolean(fieldErrors(itemIndex, "title"))}
                  helperText={fieldErrors(itemIndex, "title")}
                  onChange={(event) => update(itemIndex, { title: event.target.value })}
                  placeholder={placeholder("Title")}
                />
              )}
              {shape.description && (
                <TextField
                  size="small"
                  label={shape.description}
                  multiline
                  minRows={2}
                  value={item.description ?? ""}
                  error={Boolean(fieldErrors(itemIndex, "description"))}
                  helperText={fieldErrors(itemIndex, "description")}
                  onChange={(event) => update(itemIndex, { description: event.target.value })}
                />
              )}
              {shape.subtitle && (
                <TextField
                  size="small"
                  label={shape.subtitle}
                  value={item.subtitle ?? ""}
                  error={Boolean(fieldErrors(itemIndex, "subtitle"))}
                  helperText={fieldErrors(itemIndex, "subtitle")}
                  onChange={(event) => update(itemIndex, { subtitle: event.target.value })}
                />
              )}
              {shape.href && (
                <TextField
                  size="small"
                  label="Link"
                  value={item.href ?? ""}
                  error={Boolean(fieldErrors(itemIndex, "href"))}
                  helperText={
                    fieldErrors(itemIndex, "href") ??
                    "Path starting with /, a #anchor, or a full URL."
                  }
                  onChange={(event) => update(itemIndex, { href: event.target.value })}
                />
              )}
              {shape.icon && (
                <TextField
                  size="small"
                  label="Icon key"
                  value={item.icon ?? ""}
                  onChange={(event) => update(itemIndex, { icon: event.target.value })}
                  helperText="Optional key resolved by the frontend renderer."
                />
              )}
              {shape.external && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch
                    size="small"
                    checked={Boolean(item.external)}
                    onChange={(event) => update(itemIndex, { external: event.target.checked })}
                  />
                  <Typography variant="body2">Open in a new tab</Typography>
                </Box>
              )}
              {shape.children && (
                <Box sx={{ pl: 2, borderLeft: "2px solid", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary">
                    Links in this column
                  </Typography>
                  {(item.children ?? []).map((child, childIndex) => (
                    <Box
                      key={childIndex}
                      sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 1 }}
                    >
                      <TextField
                        size="small"
                        label="Label"
                        value={child.label ?? ""}
                        sx={{ flex: 1 }}
                        onChange={(event) => {
                          const children = [...(item.children ?? [])];
                          children[childIndex] = { ...child, label: event.target.value };
                          update(itemIndex, { children });
                        }}
                      />
                      <TextField
                        size="small"
                        label="Link"
                        value={child.href ?? ""}
                        sx={{ flex: 1 }}
                        error={Boolean(fieldErrors(itemIndex, `children.${childIndex}.href`))}
                        helperText={fieldErrors(itemIndex, `children.${childIndex}.href`)}
                        onChange={(event) => {
                          const children = [...(item.children ?? [])];
                          children[childIndex] = { ...child, href: event.target.value };
                          update(itemIndex, { children });
                        }}
                      />
                      <IconButton
                        size="small"
                        aria-label="Remove link"
                        onClick={() =>
                          update(itemIndex, {
                            children: (item.children ?? []).filter((_, i) => i !== childIndex),
                          })
                        }
                      >
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    startIcon={<AddIcon />}
                    onClick={() =>
                      update(itemIndex, { children: [...(item.children ?? []), { label: "", href: "" }] })
                    }
                  >
                    Add link
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export const SectionEditor = ({
  section,
  index,
  count,
  errors,
  onChange,
  onMove,
  onRemove,
}: SectionEditorProps) => {
  const config = SECTION_CONFIG[section.type];
  const at = (path: string) => errors[`content.sections.${index}.${path}`];
  const patch = (next: Partial<Section>) => onChange({ ...section, ...next });

  const items = section.items ?? [];

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {config.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {section.key}
            </Typography>
            {!section.visible && (
              <Typography variant="caption" color="warning.main">
                hidden
              </Typography>
            )}
          </Box>
          <Box>
            <IconButton
              size="small"
              aria-label="Move section up"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <ArrowUpwardIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Move section down"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              <ArrowDownwardIcon fontSize="inherit" />
            </IconButton>
            <IconButton size="small" aria-label="Delete section" color="error" onClick={onRemove}>
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "grid", gap: 2 }}>
          {config.headline && (
            <TextField
              label="Headline (one line per row)"
              multiline
              minRows={2}
              value={(section.headline ?? []).join("\n")}
              error={Boolean(at("headline"))}
              helperText={at("headline")}
              onChange={(event) =>
                patch({
                  headline: event.target.value.split("\n").filter((line) => line.trim().length > 0),
                })
              }
            />
          )}

          {config.heading && (
            <TextField
              label="Heading"
              value={section.heading ?? ""}
              error={Boolean(at("heading"))}
              helperText={at("heading")}
              onChange={(event) => patch({ heading: event.target.value })}
            />
          )}

          {config.subtitle && (
            <TextField
              label={config.subtitleLabel ?? "Subtitle"}
              value={section.subtitle ?? ""}
              error={Boolean(at("subtitle"))}
              helperText={at("subtitle")}
              onChange={(event) => patch({ subtitle: event.target.value })}
            />
          )}

          {config.description && (
            <TextField
              label={config.descriptionLabel ?? "Description"}
              multiline
              minRows={2}
              value={section.description ?? ""}
              error={Boolean(at("description"))}
              helperText={at("description")}
              onChange={(event) => patch({ description: event.target.value })}
            />
          )}

          {config.body && (
            <TextField
              label={config.bodyLabel ?? "Text"}
              multiline
              minRows={3}
              value={section.body ?? ""}
              error={Boolean(at("body"))}
              helperText={at("body")}
              onChange={(event) => patch({ body: event.target.value })}
            />
          )}

          {config.image && (
            <ImageField
              value={section.image}
              error={at("image.url")}
              onChange={(image) => patch({ image })}
            />
          )}

          {config.buttons?.map((buttonKey) => {
            const value = section[buttonKey] ?? { label: "", href: "" };
            const meta = BUTTON_LABELS[buttonKey];
            return (
              <Box key={buttonKey} sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 2fr" }}>
                <TextField
                  size="small"
                  label={meta.label}
                  value={value.label}
                  error={Boolean(at(`${buttonKey}.label`))}
                  helperText={at(`${buttonKey}.label`)}
                  onChange={(event) => patch({ [buttonKey]: { ...value, label: event.target.value } })}
                />
                <TextField
                  size="small"
                  label={meta.href}
                  value={value.href}
                  error={Boolean(at(`${buttonKey}.href`))}
                  helperText={at(`${buttonKey}.href`) ?? "Path starting with / or a full URL."}
                  onChange={(event) => patch({ [buttonKey]: { ...value, href: event.target.value } })}
                />
              </Box>
            );
          })}

          {config.cta && (
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 2fr" }}>
              <TextField
                size="small"
                label="Button label"
                value={section.cta?.label ?? ""}
                error={Boolean(at("cta.label"))}
                helperText={at("cta.label")}
                onChange={(event) =>
                  patch({ cta: { label: event.target.value, href: section.cta?.href ?? "" } })
                }
              />
              <TextField
                size="small"
                label="Button link"
                value={section.cta?.href ?? ""}
                error={Boolean(at("cta.href"))}
                helperText={at("cta.href") ?? "Path starting with / or a full URL."}
                onChange={(event) =>
                  patch({ cta: { label: section.cta?.label ?? "", href: event.target.value } })
                }
              />
            </Box>
          )}

          {config.stats && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2">{config.statsLabel ?? "Statistics"}</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => patch({ stats: [...(section.stats ?? []), { value: "", label: "" }] })}
                >
                  Add statistic
                </Button>
              </Box>
              {(section.stats ?? []).map((stat, statIndex) => (
                <Box
                  key={statIndex}
                  sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mt: 1 }}
                >
                  <TextField
                    size="small"
                    label="Value"
                    sx={{ flex: 1 }}
                    value={stat.value}
                    error={Boolean(at(`stats.${statIndex}.value`))}
                    helperText={at(`stats.${statIndex}.value`)}
                    onChange={(event) => {
                      const next = [...(section.stats ?? [])];
                      next[statIndex] = { ...stat, value: event.target.value };
                      patch({ stats: next });
                    }}
                  />
                  <TextField
                    size="small"
                    label="Label"
                    sx={{ flex: 2 }}
                    value={stat.label}
                    error={Boolean(at(`stats.${statIndex}.label`))}
                    helperText={at(`stats.${statIndex}.label`)}
                    onChange={(event) => {
                      const next = [...(section.stats ?? [])];
                      next[statIndex] = { ...stat, label: event.target.value };
                      patch({ stats: next });
                    }}
                  />
                  <IconButton
                    size="small"
                    aria-label="Remove statistic"
                    onClick={() =>
                      patch({ stats: (section.stats ?? []).filter((_, i) => i !== statIndex) })
                    }
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {config.items && (
            <Repeater
              title={config.label}
              addLabel={config.items.addLabel}
              items={items}
              shape={config.items}
              fieldErrors={(itemIndex, field) => at(`items.${itemIndex}.${field}`)}
              onChange={(next) => patch({ items: next })}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
          <Switch
            size="small"
            checked={section.visible}
            onChange={(event) => patch({ visible: event.target.checked })}
          />
          <Typography variant="body2">Visible on the public site</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SectionEditor;
