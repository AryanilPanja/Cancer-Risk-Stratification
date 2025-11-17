#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

#define PORT 8080
#define MAX_BUF 4096

int main() {
    struct sockaddr_in server_addr;
    socklen_t addr_len = sizeof(server_addr);
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    char buf[MAX_BUF];

    int s = socket(AF_INET, SOCK_DGRAM, 0);
    if (s < 0) {
        printf("Socket creation error!\n");
        exit(EXIT_FAILURE);
    }

    if (inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr) <= 0) {
        perror("Invalid address/ Address not supported");
        exit(EXIT_FAILURE);
    }

    snprintf(buf, sizeof(buf), "Player connected\n");
    sendto(s, buf, strlen(buf), 0, (struct sockaddr *)&server_addr, addr_len);

    while (1) {
        memset(buf, 0, sizeof(buf));

        // Receive data from server
        int cd = recvfrom(s, buf, MAX_BUF, 0, (struct sockaddr *)&server_addr, &addr_len);
        if (cd < 0) {
            printf("Error receiving data\n");
            break;
        } else if (cd == 0) {
            // Server has closed the connection
            printf("Server closed the connection\n");
            break;
        }

        printf("%s", buf);

        if(strcmp(buf, "Your opponent does not want to play again. Connection will now close.\n") == 0){
            break;
        }
        if(strcmp(buf, "Both players don't want to play again. Exiting...\n") == 0){
            break;
        }
        if(strcmp(buf, "You said no. Connection will now close.\n") == 0){
            break;
        }

        if (strcmp(buf, "Do you want to play another game? (yes/no)\n") == 0) {
            fgets(buf, sizeof(buf), stdin);
            sendto(s, buf, strlen(buf), 0, (struct sockaddr *)&server_addr, addr_len);
            continue;
        }

        if (strstr(buf, "Your move")) {
            printf("Your move, enter row col: ");
            fgets(buf, sizeof(buf), stdin);
            sendto(s, buf, strlen(buf), 0, (struct sockaddr *)&server_addr, addr_len);
        }
    }

    close(s);
    return 0;
}
