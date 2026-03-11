/**
 * Utility function to conditionally join classNames together
 * @param classes - Array of class names or conditional class names
 * @returns Combined class name string
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default classNames;
