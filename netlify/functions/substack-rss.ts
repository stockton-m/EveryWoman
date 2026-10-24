import { handleSubstackRssRequest } from "../../scripts/content/substack-proxy.js";

export default function substackRss(request: Request): Promise<Response> {
  return handleSubstackRssRequest(request, {
    token: process.env.SUBSTACK_PROXY_TOKEN,
  });
}
