export function siteUrl(origin=window.location.origin,base=import.meta.env?.BASE_URL||'/'){
 return new URL(base,origin).href;
}
