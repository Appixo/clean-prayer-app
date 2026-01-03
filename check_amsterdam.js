
async function check() {
    const url = "https://nominatim.openstreetmap.org/search?q=Amsterdam&format=json&limit=1&addressdetails=1&accept-language=en";
    const resp = await fetch(url, { headers: { 'User-Agent': 'Test/1.0' } });
    const data = await resp.json();
    console.log("DISPLAY NAME:", data[0].display_name);
}
check();
