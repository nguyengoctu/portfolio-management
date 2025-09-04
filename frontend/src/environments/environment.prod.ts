const getBaseUrl = () => {
  // Check runtime env first, fallback to window.location.origin
  return (window as any).__env?.APP_URL || window.location.origin;
};

export const environment = {
  production: true,
  // Base paths - check runtime env first
  authUrl: `${getBaseUrl()}/api/auth`,
  userUrl: `${getBaseUrl()}/api/user/users`,
  skillsUrl: `${getBaseUrl()}/api/user/skills`,
  backendUrl: `${getBaseUrl()}/api/auth`
};