export function renderTemplate(
  template: string,
  variables: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value !== undefined && value !== "" ? value : `(${key} 없음)`;
  });
}
