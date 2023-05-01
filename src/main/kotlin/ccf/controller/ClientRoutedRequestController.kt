package ccf.controller

import ccf.model.IndexModel
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.ServletContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.MessageSource
import org.springframework.context.support.MessageSourceAccessor
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles.of
import org.springframework.stereotype.Component
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.mvc.Controller
import java.util.Locale.US

/**
 * [ClientRoutedRequestController] is an implementation of the [Controller] interface which receives any request which
 * *does not* match any other request mapping and routes it to the index page. This is done on the assumption that every
 * other request corresponds to an OIDC callback, client-side route, or something similar.
 *
 * **Note:** it is important that this mapping sort *after* the standard mappings which handle controllers and static
 * resources.
 */
@Component
class ClientRoutedRequestController(
    env: Environment,
    context: ServletContext,
    messages: MessageSource
) : Controller {
    private val model = IndexModel(
        acceptance = env.acceptsProfiles(of("is-acceptance")),
        baseHref = (context.contextPath.takeUnless(""::equals) ?: "/"),
        configJson = ObjectMapper().run { writeValueAsString(emptyMap<String, Any>()) },
        env = env,
        messages = MessageSourceAccessor(messages, US),
        production = env.acceptsProfiles(of("is-production"))
    )

    override fun handleRequest(request: HttpServletRequest, response: HttpServletResponse) =
        ModelAndView("index.html", "model", model)
}
