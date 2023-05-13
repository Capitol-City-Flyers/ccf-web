package ccf.controller

import org.springframework.context.annotation.Profile
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.RequestEntity
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod.GET
import org.springframework.web.bind.annotation.RequestMethod.POST
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder
import java.net.URI

/**
 * [AircraftClubsProxyController] provides a simple proxy to AircraftClubs resources and web services for use during
 * development to work around CORS issues. This should probably be replaced with a real gateway in deployment.
 */
@Controller
@RequestMapping("/aircraftclubs")
@Profile("development")
class AircraftClubsProxyController {
    @RequestMapping(
        method = [GET, POST],
        value = ["/**"],
        consumes = [MediaType.ALL_VALUE]
    )
    @ResponseBody
    fun proxy(
        request: RequestEntity<ByteArray>,
        @CookieValue(value = "PHPSESSID", required = false) sessionId: String?
    ): ResponseEntity<ByteArray> {
        val stripped = request.url.path.removePrefix("/aircraftclubs/")
        val uriBuilder = UriComponentsBuilder.fromUri(URI.create("https://www.aircraftclubs.com/").resolve(stripped))
        if (null != request.url.query) {
            uriBuilder.query(request.url.query);
        }
        val uri = uriBuilder.toUriString();
        val headers = request.headers.let { source ->
            HttpHeaders().apply {
                if (source.accept.isNotEmpty()) {
                    accept = source.accept
                }
                if (-1L != source.contentLength) {
                    contentLength = source.contentLength
                }
                contentType = source.contentType
                if (null != sessionId) {
                    add("cookie", "PHPSESSID=$sessionId")
                }
            }
        }
        val entity = HttpEntity(request.body, headers)
        return template.exchange(uri, request.method!!, entity, ByteArray::class.java)
    }

    companion object {
        private val template = RestTemplate()
    }
}
