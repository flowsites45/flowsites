async function check() {
  try {
    const html = await (await fetch("https://flowsites.store/")).text();
    const scriptMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    console.log("Script match:", scriptMatch?.[1]);
    if (scriptMatch?.[1]) {
      const js = await (await fetch("https://flowsites.store" + scriptMatch[1])).text();
      const urls = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/g) || [];
      console.log("Supabase URLs in live bundle:", [...new Set(urls)]);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
check();
