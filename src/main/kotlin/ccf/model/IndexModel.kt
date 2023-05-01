package ccf.model

import org.springframework.context.support.MessageSourceAccessor
import org.springframework.core.env.Environment

/**
 * [IndexModel] is the backing model for the `index.html.ftlh` template.
 */
data class IndexModel(
    val acceptance: Boolean,
    val baseHref: String,
    val configJson: String,
    val env: Environment,
    val messages: MessageSourceAccessor,
    val production: Boolean
) {
    /**
     * Get a message from the localization bundle.
     *
     * @param key the message key.
     * @return [String]
     */
    @Suppress("unused")
    fun message(key: String): String =
        messages.getMessage(key, emptyArray())

    /**
     * Get a property from the environment.
     *
     * @param key the property key.
     * @return [String]
     */
    fun property(key: String): String =
        env.getRequiredProperty(key)
}
