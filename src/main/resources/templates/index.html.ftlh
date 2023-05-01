<#ftl encoding="utf-8">
<!DOCTYPE html>
<html lang="en-US">
<head>
    <title>${model.message("ccf.site.title")}</title>
    <base href="${model.baseHref}"/>
    <link rel="icon" href="./static/assets/images/favicon.png"/>
    <link rel="stylesheet" href="./static/assets/styles/brands.min.css"/>
    <link rel="stylesheet" href="./static/assets/styles/solid.min.css"/>
    <link rel="stylesheet" href="./static/assets/styles/fontawesome.min.css"/>
    <link rel="apple-touch-icon" href="./static/assets/images/apple-touch-icon-180x180.png"/>
    <script id="ccf-config" type="application/json">${model.configJson}</script>
    <script defer src="./static/main.js"></script>
    <meta name="viewport" content="height=device-height,width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
    <meta name="apple-mobile-web-app-title" content="${model.message("ccf.ios.home-screen.title")}"/>
    <meta name="title" content="${model.message("ccf.site.title")}">
    <meta name="description" content="${model.message("ccf.org.description")}">
    <#if model.production>
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://capitolcityflyers.org/">
        <meta property="og:title" content="${model.message("ccf.site.title")}">
        <meta property="og:description" content="${model.message("ccf.org.description")}">
        <meta property="og:image" content="https://capitolcityflyers.org/static/assets/images/favicon.png">
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="https://capitolcityflyers.org/">
        <meta property="twitter:title" content="${model.message("ccf.site.title")}">
        <meta property="twitter:description" content="${model.message("ccf.org.description")}">
        <meta property="twitter:image" content="https://capitolcityflyers.org/static/assets/images/favicon.png">
        <script async src="https://www.googletagmanager.com/gtag/js?id=${model.property("google.analytics.site-id")}"></script>
        <script>
            <#outputformat "JavaScript">
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag("js", new Date());
                gtag("config", "${model.property("google.analytics.site-id")}");
            </#outputformat>
        </script>
    </#if>
</head>
<body>
<div id="ccf-app"></div>
</body>
</html>
