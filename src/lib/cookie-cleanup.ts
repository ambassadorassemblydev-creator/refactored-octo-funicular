/**
 * Iron Wall Cookie Cleanup
 * Forcibly removes root domain cookies to prevent session leakage between the 
 * main church site and the admin panel.
 */
export function cleanupSharedCookies() {
  const rootDomain = '.theambassadorsassembly.org';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    
    // Specifically target shared session cookies
    if (name.includes('session') || name.includes('auth') || name.startsWith('sb-')) {
      console.log(`[Security] Isolating cookie: ${name}`);
      
      // Clear for current domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      // Clear for root domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain};`;
      // Clear for theambassadorsassembly.org (without dot)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=theambassadorsassembly.org;`;
    }
  }
}
