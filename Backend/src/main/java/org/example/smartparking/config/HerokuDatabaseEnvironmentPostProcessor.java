package org.example.smartparking.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

/**
 * Translates Heroku DB add-on URLs (JAWSDB_URL / CLEARDB_DATABASE_URL) — which use
 * the {@code mysql://user:pass@host:port/db} format — into the Spring properties
 * {@code spring.datasource.url/username/password} BEFORE Spring binds the
 * DataSource. Without this, on Heroku neither {@code JDBC_DATABASE_URL} nor the
 * username/password env vars are set, so HikariCP falls back to localhost and
 * times out with "total=0, active=0, idle=0".
 *
 * Registered via META-INF/spring.factories.
 */
public class HerokuDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String[] CANDIDATE_VARS = {"JAWSDB_URL", "JAWSDB_MARIA_URL", "CLEARDB_DATABASE_URL"};

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Prefer the raw add-on URL when present, even if JDBC_DATABASE_URL was set
        // by deploy scripts: those scripts often hard-code requireSSL=true which fails
        // the JawsDB Kitefin SSL handshake. Building the URL here keeps SSL settings
        // consistent.
        String rawUrl = null;
        for (String var : CANDIDATE_VARS) {
            String v = environment.getProperty(var);
            if (v != null && !v.isBlank()) {
                rawUrl = v;
                break;
            }
        }
        if (rawUrl == null) {
            return; // local dev — let application.properties defaults apply
        }

        try {
            URI uri = new URI(rawUrl);
            String userInfo = uri.getUserInfo();
            if (userInfo == null) return;
            String[] creds = userInfo.split(":", 2);
            String user = creds[0];
            String pass = creds.length > 1 ? creds[1] : "";

            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 3306 : uri.getPort();
            String path = uri.getPath() == null ? "" : uri.getPath();
            String db = path.startsWith("/") ? path.substring(1) : path;

            String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + db
                    + "?useSSL=true"
                    + "&requireSSL=false"
                    + "&allowPublicKeyRetrieval=true"
                    + "&serverTimezone=UTC"
                    + "&useUnicode=true"
                    + "&characterEncoding=UTF-8";

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", jdbcUrl);
            props.put("spring.datasource.username", user);
            props.put("spring.datasource.password", pass);
            props.put("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");

            // Make these win over application.properties' ${JDBC_DATABASE_URL:...} fallback.
            environment.getPropertySources().addFirst(
                    new MapPropertySource("herokuDatabaseUrl", props));

            System.out.println("[HerokuDatabaseEnvironmentPostProcessor] Configured datasource from "
                    + "Heroku add-on URL -> host=" + host + " db=" + db + " user=" + user);
        } catch (URISyntaxException e) {
            System.err.println("[HerokuDatabaseEnvironmentPostProcessor] Failed to parse DB URL: " + e.getMessage());
        }
    }
}


