# capcityflyers.com

To run:
-
1. Install Java 17 or later.
2. Start the host application.
    ```shell 
    $ ./gradlew bootRun
    ```
3. Browse to [http://localhost:8000](http://localhost:8000).
4. Click the **Members** button in the upper right to log in. Use your AircraftClubs username/password.

Notes:
-
* Continuous compilation for client-side development:
    ```shell
    $ ./gradlew -Pdevelopment --continuous processResources 
    ```
