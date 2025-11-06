document.addEventListener('DOMContentLoaded', () => {
  const languagePicker = document.getElementById('language-picker');

  if (languagePicker) {
    languagePicker.addEventListener('change', (event) => {
      const selectedLocale = event.target.value;

      // Strip the current locale from the path
      const currentPath = window.location.pathname;
      const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, '');

      // Build the new URL with the selected locale
      const newPath = `/${selectedLocale}${pathWithoutLocale}`;

      // Redirect the browser
      window.location.href = newPath;
    });
  }
});