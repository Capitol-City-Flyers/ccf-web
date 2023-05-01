package ccf

import ccf.controller.ClientRoutedRequestController
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.Bean
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles.of
import org.springframework.web.servlet.HandlerExecutionChain
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.HandlerMapping
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.EncodedResourceResolver
import java.util.*
import java.util.Collections.list
import java.util.Objects.nonNull

@SpringBootApplication
open class Main {

    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE)
    open fun clientRoutedRequestMapping(controller: ClientRoutedRequestController) =
        HandlerExecutionChain(controller).let { chain ->
            HandlerMapping { request ->

                /* Assume anything without a dot in the last path segment (or with no path) is a client-side route. */
                val last = request.requestURI.split("/").lastOrNull()
                if (true != last?.contains(".")) {
                    chain
                } else {
                    null
                }
            }
        }

    @Bean
    open fun mvcConfigurer(env: Environment) = object : WebMvcConfigurer {
        override fun addInterceptors(registry: InterceptorRegistry) {
            registry.addInterceptor(object : HandlerInterceptor {
                override fun preHandle(
                    request: HttpServletRequest,
                    response: HttpServletResponse,
                    handler: Any
                ): Boolean {
                    if (log.isDebugEnabled) {
                        log.debug(
                            "Pre handle request: ${
                                mapOf(
                                    "method" to request.method,
                                    "url" to request.requestURL,
                                    "secure" to request.isSecure,
                                    "contextPath" to request.contextPath,
                                    "requestURI" to request.requestURI,
                                    "headerNames" to list(request.headerNames).stream().sorted().toList(),
                                    "host" to request.getHeader("host"),
                                    "origin" to request.getHeader("origin"),
                                    "referer" to request.getHeader("referer"),
                                    "userAgent" to request.getHeader("user-agent")
                                ).filterValues(::nonNull)
                            }"
                        )
                    }
                    return super.preHandle(request, response, handler)
                }
            })
        }

        override fun addResourceHandlers(registry: ResourceHandlerRegistry) {

            /* Note: service worker needs to be served (from the client's perspective) from the context root. */
            val main = registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/META-INF/resources/static/")
                .resourceChain(false)
            val worker = registry.addResourceHandler(*serviceWorkerPatterns)
                .addResourceLocations("classpath:/META-INF/resources/static/")
                .resourceChain(false)

            /* Serve precompiled if and only if "optimized" profile is active. */
            if (env.acceptsProfiles(of("is-optimized"))) {
                val encodedResolver = EncodedResourceResolver()
                main.addResolver(encodedResolver)
                worker.addResolver(encodedResolver)
            }
        }
    }

    companion object {
        private val log = LoggerFactory.getLogger(Main::class.java)
        private val serviceWorkerPatterns = arrayOf(
            "/service-worker.js",
            "/service-worker.js.map",
            "/workbox-*.js",
            "/workbox-*.js.map"
        )
    }
}

fun main(args: Array<String>) {
    SpringApplication.run(Main::class.java, *args)
}
