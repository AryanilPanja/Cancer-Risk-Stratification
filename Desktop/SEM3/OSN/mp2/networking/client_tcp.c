#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

#define PORT 8080
#define MAX_BUF 4096

int main(){
    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    int s;
    int cd;
    char buf[MAX_BUF];

    s = socket(AF_INET, SOCK_STREAM, 0);
    if(s < 0){
        printf("Socket error!\n");
        exit(EXIT_FAILURE);
    }

    if (inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr) <= 0) {
        perror("Invalid address/ Address not supported");
        exit(EXIT_FAILURE);
    }

    if (connect(s, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Connection failed");
        exit(EXIT_FAILURE);
    }

    while(1){
        for(int i=0; i<sizeof(buf); i++){
            buf[i] = 0;
        }

        cd = recv(s, buf, MAX_BUF, 0);
        if (cd < 0) {
            printf("Error receiving data\n");
            break;
        } else if (cd == 0) {
            // Server has closed the connection
            printf("Server closed the connection\n");
            break;
        }

        printf("%s", buf);

        if(strstr(buf, "wins") || strstr(buf, "draw")){
            // printf("Do you want to play again? (yes/no): ");
            fgets(buf, sizeof(buf), stdin);  // Get user's response (yes or no)
            send(s, buf, strlen(buf), 0);  // Send response to the server
            continue;
        }

        if (strstr(buf, "Your move")) {
            printf("Your move, enter row col: ");
            fgets(buf, sizeof(buf), stdin);
            send(s, buf, strlen(buf), 0);
        }       
    }
    close(s);
    return 0;
}