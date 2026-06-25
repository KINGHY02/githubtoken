let token = "";
export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname !== '/') {
			let githubRawUrl = 'https://raw.githubusercontent.com';
			if (new RegExp(githubRawUrl, 'i').test(url.pathname)) {
				githubRawUrl += url.pathname.split(githubRawUrl)[1];
			} else {
				if (env.GH_NAME) {
					githubRawUrl += '/' + env.GH_NAME;
					if (env.GH_REPO) {
						githubRawUrl += '/' + env.GH_REPO;
						if (env.GH_BRANCH) githubRawUrl += '/' + env.GH_BRANCH;
					}
				}
				githubRawUrl += url.pathname;
			}
			//console.log(githubRawUrl);
			
			// 初始化请求头
			const headers = new Headers();
			let authTokenSet = false; // 标记是否已经设置了认证token
			
			// 检查TOKEN_PATH特殊路径鉴权
			if (env.TOKEN_PATH) {
				const 需要鉴权的路径配置 = await ADD(env.TOKEN_PATH);
				// 将路径转换为小写进行比较，防止大小写绕过
				const normalizedPathname = decodeURIComponent(url.pathname.toLowerCase());

				//检测访问路径是否需要鉴权
				for (const pathConfig of 需要鉴权的路径配置) {
					const configParts = pathConfig.split('@');
					if (configParts.length !== 2) {
						// 如果格式不正确，跳过这个配置
						continue;
					}

					const [requiredToken, pathPart] = configParts;
					const normalizedPath = '/' + pathPart.toLowerCase().trim();

					// 精确匹配路径段，防止部分匹配绕过
					const pathMatches = normalizedPathname === normalizedPath ||
						normalizedPathname.startsWith(normalizedPath + '/');

					if (pathMatches) {
						const providedToken = url.searchParams.get('token');
						if (!providedToken) {
							return new Response('TOKEN不能为空', { status: 400 });
						}

						if (providedToken !== requiredToken.trim()) {
							return new Response('TOKEN错误', { status: 403 });
						}

						// token验证成功，使用GH_TOKEN作为GitHub请求的token
						if (!env.GH_TOKEN) {
							return new Response('服务器GitHub TOKEN配置错误', { status: 500 });
						}
						headers.append('Authorization', `token ${env.GH_TOKEN}`);
						authTokenSet = true;
						break; // 找到匹配的路径配置后退出循环
					}
				}
			}
			
			// 如果TOKEN_PATH没有设置认证，使用默认token逻辑
			if (!authTokenSet) {
				if (env.GH_TOKEN && env.TOKEN) {
					if (env.TOKEN == url.searchParams.get('token')) token = env.GH_TOKEN || token;
					else token = url.searchParams.get('token') || token;
				} else token = url.searchParams.get('token') || env.GH_TOKEN || env.TOKEN || token;
				
				const githubToken = token;
				//console.log(githubToken);
				if (!githubToken || githubToken == '') {
					return new Response('TOKEN不能为空', { status: 400 });
				}
				headers.append('Authorization', `token ${githubToken}`);
			}

			// 发起请求
			const response = await fetch(githubRawUrl, { headers });

			// 检查请求是否成功 (状态码 200 到 299)
			if (response.ok) {
				return new Response(response.body, {
					status: response.status,
					headers: response.headers
				});
			} else {
				const errorText = env.ERROR || '无法获取文件，检查路径或TOKEN是否正确。';
				// 如果请求不成功，返回适当的错误响应
				return new Response(errorText, { status: response.status });
			}

		} else {
			const envKey = env.URL302 ? 'URL302' : (env.URL ? 'URL' : null);
			if (envKey) {
				const URLs = await ADD(env[envKey]);
				const URL = URLs[Math.floor(Math.random() * URLs.length)];
				return envKey === 'URL302' ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
			}
			//首页改成一个nginx伪装页
			return new Response(await nginx(), {
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		}
	}
};

async function nginx() {
	const text = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "国王云",
      "alternateName": ["KiNG Blog", "国王云博客"],
      "url": "https://boke.010213.xyz/"
    }
    </script>

    <title>国王云-KiNG Blog</title>
    
    <meta property="og:site_name" content="国王云">
    
    <link rel="icon" type="image/png" sizes="96x96" href="https://img.010213.xyz/favicon-96x96.png">
    <link rel="canonical" href="https://boke.010213.xyz/">
    
    <meta name="description" content="提供科学上网教程、Clash下载、翻墙软件、VPN节点与网络代理教程。">
    <meta name="keywords" content="科学上网,翻墙,VPN,Clash,TikTok,代理节点">
    <meta property="og:title" content="KiNG Blog - 国王云">
    <meta property="og:description" content="科学上网教程与代理工具分享">
    <meta property="og:image" content="https://img.771169.xyz/img/2025/touxiang.jpg">
    <meta property="og:url" content="https://boke.010213.xyz/">
    </head>
<style>
  body {
    margin:0;
    padding:0;
    font-family:"Segoe UI",Arial,sans-serif;
    overflow:hidden;
    background: linear-gradient(135deg, #0a0a1f, #1a0a2a, #0a1a2f);
    color:#fff;
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
  }

  canvas {
    position:fixed;
    top:0;
    left:0;
    z-index:0;
  }

  .scanline {
    position: fixed;
    top:0;
    left:0;
    width:100%;
    height:100%;
    background: linear-gradient(to bottom, rgba(0,255,255,0.05) 50%, transparent 50%);
    background-size: 100% 4px;
    pointer-events:none;
    animation: scan 3s linear infinite;
    z-index:1;
  }
  @keyframes scan{
    0%{background-position:0 0;}
    100%{background-position:0 4px;}
  }

  .container {
    position:relative;
    z-index:2;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    border-radius: 20px;
    padding:40px 30px;
    text-align:center;
    width:90%;
    max-width:600px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    box-shadow: 0 0 40px rgba(0, 255, 255, 0.2);
  }

  .avatar-wrapper{
    position: relative;
    display: inline-block;
  }

  .avatar {
    width:130px;
    height:130px;
    border-radius:50%;
    border:2px solid #0ff;
    box-shadow:0 0 25px #0ff;
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0%,100%{transform: translateY(0);}
    50%{transform: translateY(-15px);}
  }

  .avatar-ring{
    position:absolute;
    top:170px;
    left:50%;
    transform: translateX(-50%);
    width:160px;
    height:20px;
    border-radius:50%;
    background: radial-gradient(ellipse at center, rgba(0,255,255,0.6), transparent 70%);
    filter: blur(8px);
    animation: ringPulse 3s infinite ease-in-out;
  }

  @keyframes ringPulse{
    0%,100%{transform:translateX(-50%) scale(1);opacity:0.6;}
    50%{transform:translateX(-50%) scale(1.2);opacity:1;}
  }

  h1{
    font-size:28px;
    margin-top:25px;
    background: linear-gradient(90deg,#0ff,#0af,#0ff);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    text-shadow:0 0 15px rgba(0,255,255,0.6);
  }

  p{
    font-size:16px;
    margin:15px 0 25px;
    color:#a0d8ff;
    line-height:1.5;
  }

  .btn{
    display:inline-block;
    padding:14px 40px;
    font-size:16px;
    font-weight:bold;
    color:#0ff;
    border:1px solid rgba(0,255,255,0.6);
    border-radius:50px;
    background: rgba(0, 255, 255,0.1);
    backdrop-filter: blur(5px);
    text-decoration:none;
    box-shadow:0 0 25px rgba(0,255,255,0.4);
    position:relative;
    overflow:hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .btn:hover{
    transform: scale(1.08);
    box-shadow:0 0 40px rgba(0,255,255,0.9);
  }

  .btn::after{
    content:"";
    position:absolute;
    top:50%;
    left:50%;
    width:0;
    height:0;
    border-radius:50%;
    background: rgba(0,255,255,0.2);
    transform:translate(-50%,-50%);
    transition: width 0.6s ease, height 0.6s ease;
    z-index:-1;
  }

  .btn:active::after{
    width:300px;
    height:300px;
  }

  em{
    display:block;
    margin-top:25px;
    font-size:14px;
    color:#88cfff;
  }

  .floating-shape{
    position:absolute;
    border:1px solid rgba(0,255,255,0.3);
    width:20px;
    height:20px;
    border-radius:4px;
    animation: floatShape 6s linear infinite;
    z-index:1;
  }

  @keyframes floatShape{
    0%{transform: translate(0,0) rotate(0deg);}
    50%{transform: translate(50px,-30px) rotate(180deg);}
    100%{transform: translate(0,0) rotate(360deg);}
  }
</style>
</head>
<body>

<canvas id="bg"></canvas>
<div class="scanline"></div>

<div class="container">
  <div class="avatar-wrapper">
    <img src="https://img.771169.xyz/img/2025/touxiang.jpg" alt="头像" class="avatar">
    <div class="avatar-ring"></div>
  </div>
  <h1>欢迎访问KiNG的博客 </h1>
  <p>🚀下载网络代理软件、获取科学上网教程，以及破解软件分享。我们的教程手把手教你，轻松上网，自由探索全球内容。</p>
  <a href="https://boke.010213.xyz/" class="btn">进入博客</a>
  <em>💡提供最新翻墙软件和网络教程，安全高效，畅享全球信息。</em>
</div>

<div class="floating-shape" style="top:50px; left:80px;"></div>
<div class="floating-shape" style="top:200px; left:300px;"></div>
<div class="floating-shape" style="top:400px; left:150px;"></div>
<div class="floating-shape" style="top:100px; left:500px;"></div>

<script>
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
let stars = [];
for(let i=0;i<120;i++){
  stars.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*2,d:Math.random()*1});
}

function drawStars(){
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(0,255,255,0.6)";
  ctx.beginPath();
  for(let s of stars){
    ctx.moveTo(s.x,s.y);
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2,true);
  }
  ctx.fill();
  updateStars();
}

function updateStars(){
  for(let s of stars){
    s.y += s.d;
    if(s.y>h){ s.y=0; s.x=Math.random()*w; }
  }
}

function animate(){
  drawStars();
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize",()=>{
  w=canvas.width=window.innerWidth;
  h=canvas.height=window.innerHeight;
});
</script>

</body>
</html>
	`
	return text;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}

		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines;
		if (content.includes('\r\n')) {
			lines = content.split('\r\n');
		} else {
			lines = content.split('\n');
		}

		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				const 备改内容 = `, mtu: 1280, udp: true`;
				const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
				result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
			} else {
				result += line + '\n';
			}
		}

		content = result;
	}
	return content;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	// 解析目标 URL
	let parsedURL = new URL(fullURL);
	console.log(parsedURL);
	// 提取并可能修改 URL 组件
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	// 处理 pathname
	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	// 构建新的 URL
	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	// 反向代理请求
	let response = await fetch(newURL);

	// 创建新的响应
	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	// 添加自定义头部，包含 URL 信息
	//newResponse.headers.set('X-Proxied-By', 'Cloudflare Worker');
	//newResponse.headers.set('X-Original-URL', fullURL);
	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) {
		return [];
	} else api = [...new Set(api)]; // 去重
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
	const timeout = setTimeout(() => {
		controller.abort(); // 2秒后取消所有请求
	}, 2000);

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));

		// 遍历所有响应
		const modifiedResponses = responses.map((response, index) => {
			// 检查是否请求成功
			if (response.status === 'rejected') {
				const reason = response.reason;
				if (reason && reason.name === 'AbortError') {
					return {
						status: '超时',
						value: null,
						apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
					};
				}
				console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
				return {
					status: '请求失败',
					value: null,
					apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
				};
			}
			return {
				status: response.status,
				value: response.value,
				apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
			};
		});

		console.log(modifiedResponses); // 输出修改后的响应数组

		for (const response of modifiedResponses) {
			// 检查响应状态是否为'fulfilled'
			if (response.status === 'fulfilled') {
				const content = await response.value || 'null'; // 获取响应的内容
				if (content.includes('proxies:')) {
					//console.log('Clash订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Clash 配置
				} else if (content.includes('outbounds"') && content.includes('inbounds"')) {
					//console.log('Singbox订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
				} else if (content.includes('://')) {
					//console.log('明文订阅: ' + response.apiUrl);
					newapi += content + '\n'; // 追加内容
				} else if (isValidBase64(content)) {
					//console.log('Base64订阅: ' + response.apiUrl);
					newapi += base64Decode(content) + '\n'; // 解码并追加内容
				} else {
					const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
					console.log('异常订阅: ' + 异常订阅LINK);
					异常订阅 += `${异常订阅LINK}\n`;
				}
			}
		}
	} catch (error) {
		console.error(error); // 捕获并输出错误信息
	} finally {
		clearTimeout(timeout); // 清除定时器
	}

	const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
	// 返回处理后的结果
	return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	// 设置自定义 User-Agent
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);

	// 构建新的请求对象
	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.method === "GET" ? null : request.body,
		redirect: "follow",
		cf: {
			// 忽略SSL证书验证
			insecureSkipVerify: true,
			// 允许自签名证书
			allowUntrusted: true,
			// 禁用证书验证
			validateCertificate: false
		}
	});

	// 输出请求的详细信息
	console.log(`请求URL: ${targetUrl}`);
	console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
	console.log(`请求方法: ${request.method}`);
	console.log(`请求体: ${request.method === "GET" ? null : request.body}`);

	// 发送请求并返回响应
	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	// 先移除所有空白字符(空格、换行、回车等)
	const cleanStr = str.replace(/\s/g, '');
	const base64Regex = /^[A-Za-z0-9+/=]+$/;
	return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	const 新数据 = await env.KV.get(txt);

	if (旧数据 && !新数据) {
		// 写入新位置
		await env.KV.put(txt, 旧数据);
		// 删除旧数据
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	try {
		// POST请求处理
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const content = await request.text();
				await env.KV.put(txt, content);
				return new Response("保存成功");
			} catch (error) {
				console.error('保存KV时发生错误:', error);
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		// GET请求部分
		let content = '';
		let hasKV = !!env.KV;

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
			} catch (error) {
				console.error('读取KV时发生错误:', error);
				content = '读取数据时发生错误: ' + error.message;
			}
		}

		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<title>${FileName} 订阅编辑</title>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1">
					<style>
						body {
							margin: 0;
							padding: 15px; /* 调整padding */
							box-sizing: border-box;
							font-size: 13px; /* 设置全局字体大小 */
						}
						.editor-container {
							width: 100%;
							max-width: 100%;
							margin: 0 auto;
						}
						.editor {
							width: 100%;
							height: 300px; /* 调整高度 */
							margin: 15px 0; /* 调整margin */
							padding: 10px; /* 调整padding */
							box-sizing: border-box;
							border: 1px solid #ccc;
							border-radius: 4px;
							font-size: 13px;
							line-height: 1.5;
							overflow-y: auto;
							resize: none;
						}
						.save-container {
							margin-top: 8px; /* 调整margin */
							display: flex;
							align-items: center;
							gap: 10px; /* 调整gap */
						}
						.save-btn, .back-btn {
							padding: 6px 15px; /* 调整padding */
							color: white;
							border: none;
							border-radius: 4px;
							cursor: pointer;
						}
						.save-btn {
							background: #4CAF50;
						}
						.save-btn:hover {
							background: #45a049;
						}
						.back-btn {
							background: #666;
						}
						.back-btn:hover {
							background: #555;
						}
						.save-status {
							color: #666;
						}
					</style>
					<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
				</head>
				<body>
</html>
	`
	return text;
}

async function ADD(envadd) {
	var addtext = envadd.replace(/[	|"'\r\n]+/g, ',').replace(/,+/g, ',');	// 将空格、双引号、单引号和换行符替换为逗号
	//console.log(addtext);
	if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == ',') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split(',');
	//console.log(add);
	return add;
}
