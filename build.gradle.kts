import com.aayushatharva.brotli4j.Brotli4jLoader
import com.aayushatharva.brotli4j.encoder.BrotliOutputStream
import com.fasterxml.jackson.databind.ObjectMapper
import com.github.gradle.node.npm.task.NpmTask
import com.github.gradle.node.npm.task.NpmInstallTask
import com.github.gradle.node.task.NodeTask
import java.util.Properties
import java.util.zip.GZIPOutputStream

repositories {
    mavenCentral()
}

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {

        /* Brotli library for pre-compressing web resources. */
        val brotli4jOs = when (val os = System.getProperty("os.name")) {
            "Mac OS X" -> "osx"
            else -> os.split(" ").first().lowercase()
        }
        val brotli4jArch = when (val arch = System.getProperty("os.arch")) {
            "amd64" -> "x86_64"
            else -> arch
        }
        classpath("com.aayushatharva.brotli4j:brotli4j:1.11.0")
        classpath("com.aayushatharva.brotli4j:native-$brotli4jOs-$brotli4jArch:1.11.0")
    }
}

plugins {
    kotlin("jvm")
    `maven-publish`
    id("org.springframework.boot")
    id("com.github.node-gradle.node")
}

apply(from = "./repository.gradle.kts")

group = "ccf"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
    withJavadocJar()
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            artifact(tasks.getByName("bootJar"))
        }
    }
    repositories {
        val ccfArtifacts: Action<RepositoryHandler> by rootProject.extra
        ccfArtifacts(this)
    }
}

sourceSets {
    named(SourceSet.MAIN_SOURCE_SET_NAME) {
        output.dir(buildDir.resolve("./generated/resources/messages"), "builtBy" to "assembleMessages")
        output.dir(buildDir.resolve("./generated/resources/webpack"), "builtBy" to "webpack")
        if (!project.hasProperty("development")) {
            output.dir(buildDir.resolve("./generated/resources/compressed"), "builtBy" to "compressResources")
        }
    }
}

dependencies {
    compileOnly(group = "jakarta.servlet", name = "jakarta.servlet-api")
    implementation(platform("org.springframework.boot:spring-boot-dependencies:${project.ext["spring_boot_version"]}"))
    implementation(group = "com.fasterxml.jackson.core", name = "jackson-databind")
    implementation(group = "org.slf4j", name = "slf4j-api")
    implementation(group = "org.springframework", name = "spring-webmvc")
    implementation(group = "org.springframework.boot", name = "spring-boot")
    implementation(group = "org.springframework.boot", name = "spring-boot-autoconfigure")
    runtimeOnly(group = "com.fasterxml.jackson.module", name = "jackson-module-kotlin")
    runtimeOnly(group = "org.freemarker", name = "freemarker")
    runtimeOnly(group = "org.springframework", name = "spring-context-support")
    runtimeOnly(group = "org.springframework.boot", name = "spring-boot-starter-actuator")
    runtimeOnly(group = "org.springframework.boot", name = "spring-boot-starter-web")
}

testing {
    suites {
        withType<JvmTestSuite> {
            useJUnitJupiter()
            dependencies {
                runtimeOnly("ch.qos.logback:logback-classic")
                implementation("org.assertj:assertj-core")
            }
        }
    }
}


/**
 * Assemble all `src/main/resources/messages*.properties file into a JSON document, which is a hash of locale IDs to
 * maps of key/value message pairs.
 */
val assembleMessages by tasks.registering(Task::class) {
    description = "Assembles messages*.properties file into a Javascript variable"
    group = "build"
    val outputFile = buildDir.resolve("./generated/resources/messages/META-INF/resources/static/messages.json")
    val messagesFiles = fileTree(projectDir.resolve("./src/main/resources")) {
        include("messages*.properties")
    }
    inputs.files(messagesFiles)
    outputs.file(outputFile)
    doLast {
        val messagesByLocale = messagesFiles.associate { file ->
            val name = file.name
            val locale = name.removeSurrounding("messages_", ".properties")
                .takeUnless(name::equals)
                ?.replace('_', '-')
                ?: ""
            locale to Properties().also { properties ->
                file.inputStream().use(properties::load)
            }
        }
        ObjectMapper().writeValue(outputFile, messagesByLocale)
    }
}

/**
 * Compress all resources from the main source set, as well as the output of the [webpack] task, using Gzip and Brotli.
 * The compressed versions are added as resources which can be served directly to browsers that support these encodings.
 */
val compressResources by tasks.registering(Task::class) {
    description = "Pre-compresses web resources"
    group = "build"
    dependsOn(processResources)
    val outputDir = buildDir.resolve("./generated/resources/compressed/META-INF/resources")
    inputs.files(processResources)
    outputs.dir(outputDir)
    doLast {
        Brotli4jLoader.ensureAvailability()
        inputs.files.asFileTree.matching {
            include(
                "**/*.css",
                "**/*.js",
                "**/*.json",
                "**/*.map",
                "**/*.ttf",
                "**/*.txt"
            )
        }.forEach { source ->
            val path = source.path.replace('\\', '/')
            val relative = path.split("/resources/").last()
            outputDir.resolve(relative).parentFile.mkdirs()
            source.inputStream().use { input ->
                val target = outputDir.resolve("$relative.gz")
                GZIPOutputStream(target.outputStream()).use(input::copyTo)
            }
            source.inputStream().use { input ->
                val target = outputDir.resolve("$relative.br")
                BrotliOutputStream(target.outputStream()).use(input::copyTo)
            }
        }
    }
}

val npmInstall by tasks.getting(NpmInstallTask::class)

/**
 * Bundle scripts and resources via Webpack.
 */
val webpack by tasks.registering(NodeTask::class) {
    description = "Assembles Webpack resources."
    group = "build"
    dependsOn(assembleMessages, npmInstall)

    /* Gradle task inputs and outputs. */
    val outputDir = buildDir.resolve("./generated/resources/webpack/META-INF/resources/static")
    val webpackConfigFile = projectDir.resolve("./webpack.config.js")
    val webpackScript = projectDir.resolve("./node_modules/webpack/bin/webpack.js")
    val sourceDir = projectDir.resolve("./src/main/webpack")
    val templateFiles = fileTree(projectDir.resolve("./src/main/resources")) {
        include("templates/*")
    }
    inputs.dir(sourceDir)
    inputs.files(
        assembleMessages,
        templateFiles,
        webpackConfigFile,
        projectDir.resolve("./package.json"),
        projectDir.resolve("./postcss.config.js"),
        projectDir.resolve("./tailwind.config.js"),
        projectDir.resolve("./tsconfig.json")
    )
    outputs.dir(outputDir)

    /* Set Node script, environment, and argument array. */
    script.set(webpackScript)
    args.addAll(
        "--context",
        projectDir.absolutePath,
        "--mode",
        if (project.hasProperty("development")) {
            "development"
        } else {
            "production"
        },
        "-o",
        outputDir.absolutePath
    )
}

/**
 * Run all Webpack Jest tests.
 */
val webpackTest by tasks.registering(NpmTask::class) {
    description = "Runs Jest tests"
    group = "verification"
    dependsOn(processResources, webpack)
    inputs.dir(projectDir.resolve("./src/test/webpack"))
    inputs.files(webpack)
    outputs.dirs(
        buildDir.resolve("./test-results/webpackTest"),
        buildDir.resolve("./reports/tests/webpackTest")
    )
    npmCommand.add("test")
}

/* Additional dependencies for the `check` task. */
val check by tasks.getting(Task::class) {
    dependsOn(webpackTest)
}

/* Remove `node_modules` and `package-lock.json` on clean. */
val clean by tasks.getting(Task::class) {
    doLast {
        delete("./node_modules", "./package-lock.json")
    }
}

/**
 * Include Webpack packaging when assembling artifacts.
 */
val processResources by tasks.getting(Task::class) {
    dependsOn(webpack)
    outputs.dir(webpack)
}
