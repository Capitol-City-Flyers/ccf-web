/*
 * repository.gradle.kts
 *
 * Binds an `Action<RepositoryHandler>` as `ccfArtifacts` on the extra properties of the enclosing scope. This is
 * used to define the internal artifact repository *once* and allow it to be included in multiple contexts, including
 * plugin repositories, dependency repositories, and publication targets.
 *
 * Use `apply(from = "./repository.gradle.kts")` from the scope which needs access to the repository, then apply the
 * repository as follows:
 *
 * ```
 * repositories {
 *     val ccfArtifacts: Action<RepositoryHandler> by extra
 *     ccfArtifacts(this)
 * }
 * ```
 *
 * This is less "concise" than I'd like it to be, but it's the only way I've found to express the repository
 * configuration once, in one file, and share it across all of the contexts where it may be needed. The primary problem
 * is that `pluginManagement { ... }` blocks are separate scripts which do not have access to functions or data defined
 * in their surrounding scripts, therefore it is not possible to share the repository configuration purely within
 * `settings.gradle.kts`, for example.
 *
 * This file should be present, copied and unmodified, in all projects that need access to the artifact repository.
 */

/**
 * Environment variable which exposes the GitHub Personal Access Token in developer local environments.
 */
val PAT_ENV_KEY = "CCF_GITHUB_PERSONAL_ACCESS_TOKEN"

/**
 * Bind the repository handler to `extra` of the enclosing scope.
 */
extra.set("ccfArtifacts", Action<RepositoryHandler> {
    maven {
        val ccf_artifacts_username: String by extra("__does_not_matter__")
        name = "ccfArtifacts"
        url = uri("https://maven.pkg.github.com/Capitol-City-Flyers/ccf-artifacts")
        credentials {
            username = ccf_artifacts_username
            password = if (extra.has("ccf_artifacts_password")) {
                extra["ccf_artifacts_password"] as String
            } else {
                System.getenv(PAT_ENV_KEY)?.let(String::trim)?.takeUnless(String::isBlank)
                    ?: "no-pat-found" /* Not going to fail over this now because it's only used on publish. */
//                    ?: throw GradleException(
//                        """
//                        The [$PAT_ENV_KEY] environment variable has not been set. This should be set to the GitHub
//                        personal access token through which you will access the ccf-artifacts repository.
//                        """.trimIndent()
//                    )
            }
        }
    }
})
