import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "publish-social-post@2026-02-26";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── OAuth 1.0a helpers for Twitter ────────────────────────────
async function hmacSha1(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function oauthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  tokenSecret: string,
  extraParams: Record<string, string> = {}
): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
    ...extraParams,
  };

  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = await hmacSha1(signingKey, baseString);

  oauthParams.oauth_signature = signature;
  const header = Object.keys(oauthParams)
    .filter((k) => k.startsWith("oauth_"))
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

// ─── Platform publishers ───────────────────────────────────────

async function postToTwitter(caption: string, imageUrl: string): Promise<{ status: string; post_id?: string; error?: string }> {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY")!;
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")!;
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")!;
  const tokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!;

  if (!consumerKey || !consumerSecret || !accessToken || !tokenSecret) {
    return { status: "error", error: "Twitter API keys not configured" };
  }

  try {
    // Step 1: Download image bytes
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error("Failed to download image");
    const imgBytes = new Uint8Array(await imgResp.arrayBuffer());
    const contentType = imgResp.headers.get("content-type") || "image/jpeg";

    // Step 2: Upload media via v1.1 chunked upload
    const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";

    // INIT
    const initParams: Record<string, string> = {
      command: "INIT",
      total_bytes: imgBytes.byteLength.toString(),
      media_type: contentType,
    };
    const initForm = new URLSearchParams(initParams);
    const initAuth = await oauthHeader("POST", uploadUrl, consumerKey, consumerSecret, accessToken, tokenSecret);
    const initResp = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: initAuth, "Content-Type": "application/x-www-form-urlencoded" },
      body: initForm.toString(),
    });
    if (!initResp.ok) {
      const errText = await initResp.text();
      throw new Error(`Media INIT failed: ${errText}`);
    }
    const { media_id_string } = await initResp.json();

    // APPEND
    const appendForm = new FormData();
    appendForm.append("command", "APPEND");
    appendForm.append("media_id", media_id_string);
    appendForm.append("segment_index", "0");
    appendForm.append("media_data", btoa(String.fromCharCode(...imgBytes)));
    const appendAuth = await oauthHeader("POST", uploadUrl, consumerKey, consumerSecret, accessToken, tokenSecret);
    const appendResp = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: appendAuth },
      body: appendForm,
    });
    if (!appendResp.ok) {
      const errText = await appendResp.text();
      throw new Error(`Media APPEND failed: ${errText}`);
    }
    // Consume body
    await appendResp.text();

    // FINALIZE
    const finalForm = new URLSearchParams({ command: "FINALIZE", media_id: media_id_string });
    const finalAuth = await oauthHeader("POST", uploadUrl, consumerKey, consumerSecret, accessToken, tokenSecret);
    const finalResp = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: finalAuth, "Content-Type": "application/x-www-form-urlencoded" },
      body: finalForm.toString(),
    });
    if (!finalResp.ok) {
      const errText = await finalResp.text();
      throw new Error(`Media FINALIZE failed: ${errText}`);
    }
    await finalResp.json();

    // Step 3: Create tweet with media via v2
    const tweetUrl = "https://api.x.com/2/tweets";
    const tweetAuth = await oauthHeader("POST", tweetUrl, consumerKey, consumerSecret, accessToken, tokenSecret);
    const tweetResp = await fetch(tweetUrl, {
      method: "POST",
      headers: { Authorization: tweetAuth, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: caption.slice(0, 280),
        media: { media_ids: [media_id_string] },
      }),
    });
    if (!tweetResp.ok) {
      const errText = await tweetResp.text();
      throw new Error(`Tweet creation failed: ${errText}`);
    }
    const tweetData = await tweetResp.json();
    return { status: "success", post_id: tweetData.data?.id };
  } catch (e: any) {
    return { status: "error", error: e.message };
  }
}

async function postToLinkedIn(caption: string, imageUrl: string): Promise<{ status: string; post_id?: string; error?: string }> {
  const token = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  const orgId = Deno.env.get("LINKEDIN_ORG_ID");
  if (!token || !orgId) return { status: "error", error: "LinkedIn credentials not configured" };

  try {
    // Step 1: Register image upload
    const regResp = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: orgId.startsWith("urn:") ? orgId : `urn:li:organization:${orgId}`,
        },
      }),
    });
    if (!regResp.ok) {
      const errText = await regResp.text();
      throw new Error(`LinkedIn image init failed: ${errText}`);
    }
    const regData = await regResp.json();
    const uploadUrl = regData.value.uploadUrl;
    const imageUrn = regData.value.image;

    // Step 2: Upload image binary
    const imgResp = await fetch(imageUrl);
    const imgBlob = await imgResp.blob();
    const uploadResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: imgBlob,
    });
    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      throw new Error(`LinkedIn image upload failed: ${errText}`);
    }
    await uploadResp.text();

    // Step 3: Create post
    const author = orgId.startsWith("urn:") ? orgId : `urn:li:organization:${orgId}`;
    const postResp = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author,
        commentary: caption.slice(0, 3000),
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        content: {
          media: { title: "Image", id: imageUrn },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!postResp.ok) {
      const errText = await postResp.text();
      throw new Error(`LinkedIn post creation failed: ${errText}`);
    }
    const postId = postResp.headers.get("x-restli-id") || "unknown";
    return { status: "success", post_id: postId };
  } catch (e: any) {
    return { status: "error", error: e.message };
  }
}

async function postToFacebook(caption: string, imageUrl: string): Promise<{ status: string; post_id?: string; error?: string }> {
  const token = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const pageId = Deno.env.get("META_PAGE_ID");
  if (!token || !pageId) return { status: "error", error: "Meta credentials not configured" };

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          message: caption,
          access_token: token,
        }),
      }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Facebook post failed: ${errText}`);
    }
    const data = await resp.json();
    return { status: "success", post_id: data.post_id || data.id };
  } catch (e: any) {
    return { status: "error", error: e.message };
  }
}

async function postToInstagram(caption: string, imageUrl: string): Promise<{ status: string; post_id?: string; error?: string }> {
  const token = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const pageId = Deno.env.get("META_PAGE_ID");
  if (!token || !pageId) return { status: "error", error: "Meta credentials not configured" };

  try {
    // Get connected Instagram account ID
    const igResp = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`
    );
    if (!igResp.ok) {
      const errText = await igResp.text();
      throw new Error(`Failed to get IG account: ${errText}`);
    }
    const igData = await igResp.json();
    const igUserId = igData.instagram_business_account?.id;
    if (!igUserId) throw new Error("No Instagram Business Account connected to this Facebook Page");

    // Step 1: Create media container
    const containerResp = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption.slice(0, 2200),
          access_token: token,
        }),
      }
    );
    if (!containerResp.ok) {
      const errText = await containerResp.text();
      throw new Error(`IG container creation failed: ${errText}`);
    }
    const containerData = await containerResp.json();
    const creationId = containerData.id;

    // Step 2: Publish
    const publishResp = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: token,
        }),
      }
    );
    if (!publishResp.ok) {
      const errText = await publishResp.text();
      throw new Error(`IG publish failed: ${errText}`);
    }
    const publishData = await publishResp.json();
    return { status: "success", post_id: publishData.id };
  } catch (e: any) {
    return { status: "error", error: e.message };
  }
}

// ─── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // Admin check
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) =>
      ["admin", "super_admin", "support_admin"].includes(r.role)
    );
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    // Parse body
    const { caption, image_url, platforms } = await req.json();
    if (!caption || !image_url || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return json({ error: "caption, image_url, and platforms[] are required" }, 400);
    }

    // Fan out to platforms
    const results: Record<string, any> = {};
    const tasks: Promise<void>[] = [];

    for (const platform of platforms) {
      const task = (async () => {
        switch (platform) {
          case "twitter":
            results.twitter = await postToTwitter(caption, image_url);
            break;
          case "linkedin":
            results.linkedin = await postToLinkedIn(caption, image_url);
            break;
          case "facebook":
            results.facebook = await postToFacebook(caption, image_url);
            break;
          case "instagram":
            results.instagram = await postToInstagram(caption, image_url);
            break;
          default:
            results[platform] = { status: "error", error: `Unknown platform: ${platform}` };
        }
      })();
      tasks.push(task);
    }

    await Promise.all(tasks);

    // Save to DB
    await adminClient.from("social_posts").insert({
      caption,
      image_url,
      platforms: results,
      posted_by: user.id,
    });

    console.log(`[${VERSION}] Published social post by ${user.id}:`, JSON.stringify(results));

    return json({ success: true, results, version: VERSION });
  } catch (e: any) {
    console.error(`[${VERSION}] Error:`, e.message);
    return json({ error: "Internal server error" }, 500);
  }
});
