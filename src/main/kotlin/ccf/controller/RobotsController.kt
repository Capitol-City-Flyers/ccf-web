package ccf.controller

import org.springframework.context.annotation.Profile
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import java.nio.charset.StandardCharsets.UTF_8

/**
 * [RobotsController] serves a dummy `robots.txt` file in *acceptance* (development, test, exhibition, etc.)
 * environments to request that search engines not index the site.
 */
@Controller
@RequestMapping("/robots.txt")
@Profile("is-acceptance")
class RobotsController {

    @GetMapping
    fun get(): ResponseEntity<ByteArray> = robotsTxtResponse

    companion object {
        private val robotsTxtResponse = ResponseEntity.ok().run {
            val body = """
                User-agent: *
                Disallow: /
                
            """.trimIndent()
                .replace("\r\n", "\n")
                .encodeToByteArray()
            contentType(MediaType(MediaType.TEXT_PLAIN, UTF_8))
                .contentLength(body.size.toLong())
                .body(body)
        }
    }
}
