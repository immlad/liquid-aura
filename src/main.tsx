const hash = window.location.hash;
const queryString = hash.includes("?") ? hash.split("?")[1] : "";
const params = new URLSearchParams(queryString);

const syncedUser = params.get("user");
const syncedAdmin = params.get("admin") === "true";
const syncedTheme = params.get("theme");
const syncedAvatar = params.get("avatar");