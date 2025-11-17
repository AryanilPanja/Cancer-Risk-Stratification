#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

#define MAX 4096
#define BUF_MAX 4096
#define PORT 8080

int check_for_win(char board[4][4]){
    for (int i = 1; i < 4; i++) {
        if (board[i][1] == board[i][2] && board[i][2] == board[i][3] && board[i][1] != '.')
            return 1;
        if (board[1][i] == board[2][i] && board[2][i] == board[3][i] && board[1][i] != '.')
            return 1;
    }
    if (board[1][1] == board[2][2] && board[2][2] == board[3][3] && board[1][1] != '.')
        return 1;
    if (board[1][3] == board[2][2] && board[2][2] == board[3][1] && board[1][3] != '.')
        return 1;
    return 0;
}

void reset_board(char board[4][4]) {
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            board[i][j] = '.';
        }
    }
}

int main(){
    char board[4][4];
    for(int i=0; i<4; i++){
        for(int j=0; j<4; j++){
            board[i][j] = '.';
        }
    }
    int player = 0;

    int ref_fd;
    struct sockaddr_in server_addr, client_addr1, client_addr2;
    socklen_t addr_len = sizeof(server_addr);
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    int opt = 1;


    ref_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (ref_fd == -1) {
        printf("Socket creation error!\n");
        exit(EXIT_FAILURE);
    }

    // Set socket options to reuse address and port
    if (setsockopt(ref_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))) {
        printf("setsockopt error!\n");
        exit(EXIT_FAILURE);
    }
    
    if (bind(ref_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        printf("Bind error!\n");
        close(ref_fd);
        exit(EXIT_FAILURE);
    }

    // printf("Waiting for players to connect...\n");

    char buf[BUF_MAX];
    recvfrom(ref_fd, buf, BUF_MAX, 0, (struct sockaddr *)&client_addr1, &addr_len);
    printf("Player 1 connected\n");

    recvfrom(ref_fd, buf, BUF_MAX, 0, (struct sockaddr *)&client_addr2, &addr_len);
    printf("Player 2 connected\n");

    int mo = 0;
    while (1) {
        struct sockaddr_in current_client;
        if (player == 0) {
            current_client = client_addr1;
        } else {
            current_client = client_addr2;
        }

        if(mo == 0){
            printf("current board is : \n");
            for (int i = 1; i < 4; i++) {
                for (int j = 1; j < 4; j++) {
                    printf("%c ", board[i][j]);
                }
                printf("\n");
            }
            snprintf(buf, sizeof(buf), "Current board is:\n");
        for (int i = 1; i < 4; i++) {
            for (int j = 1; j < 4; j++) {
                snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "%c ", board[i][j]);
            }
            snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "\n");
        }
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
        }

        snprintf(buf, sizeof(buf), "Your move, enter row col: ");
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&current_client, addr_len);

        recvfrom(ref_fd, buf, BUF_MAX, 0, (struct sockaddr *)&current_client, &addr_len);
        int r, c;
        if (sscanf(buf, "%d %d", &r, &c) != 2 || r < 1 || r > 3 || c < 1 || c > 3 || board[r][c] != '.') {
            snprintf(buf, sizeof(buf), "Invalid move, try again!\n");
            sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&current_client, addr_len);
            continue;
        }

        if(player == 0){
            board[r][c] = 'X';
        }
        else{
            board[r][c] = 'O';
        }
        mo++;

        if (check_for_win(board)) {

            printf("winning board is : \n");
            for (int i = 1; i < 4; i++) {
                for (int j = 1; j < 4; j++) {
                    printf("%c ", board[i][j]);
                }
                printf("\n");
            }
            
            snprintf(buf, sizeof(buf), "Player %d wins!\n", player + 1);
            printf("Player %d wins!\n", player + 1);
            sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
            sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
            
            // snprintf(buf, sizeof(buf), "winning board is : \n");
            // for(int i=1;i<4;i++){
            //     for (int j=1;j<4;j++){
            //         snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "%c ", board[i][j]);
            //     }
            //     snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "\n");
            // }
            // sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
            // sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len); 
            char p1_response[BUF_MAX], p2_response[BUF_MAX];
            memset(p1_response, 0, sizeof(p1_response));
            memset(p2_response, 0, sizeof(p2_response));

            snprintf(buf, sizeof(buf), "Do you want to play another game? (yes/no)\n");
            sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
            int r1 = recvfrom(ref_fd, p1_response, BUF_MAX, 0, (struct sockaddr *)&client_addr1, &addr_len);
            // printf("Player 1 response: %s\n", p1_response);

            snprintf(buf, sizeof(buf), "Do you want to play another game? (yes/no)\n");
            sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
            int r2 = recvfrom(ref_fd, p2_response, BUF_MAX, 0, (struct sockaddr *)&client_addr2, &addr_len);
            // printf("Player 2 response: %s\n", p2_response);
            
            if(r1 > 0){
                p1_response[r1] = '\0';
                strtok(p1_response, "\n");
            }
            if(r2 > 0){
                p2_response[r2] = '\0';
                strtok(p2_response, "\n");
            }
            else{
                printf("Data from client not received\n");
                break;
            }

            int p1_wants_to_play = (strstr(p1_response, "yes") != NULL);
            int p2_wants_to_play = (strstr(p2_response, "yes") != NULL);

            if (p1_wants_to_play && p2_wants_to_play) {
                // Both players want to play again
                printf("Both players want to play again. Restarting the game...\n");
                reset_board(board);  // Reset the board for a new game
                mo = 0;
                player = 0;
                continue;  // Start a new game
            }
            else if (!p1_wants_to_play && !p2_wants_to_play){
                printf("Both players don't want to play again. Exiting...\n");
                snprintf(buf, sizeof(buf), "Both players don't want to play again. Exiting...\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
                // close(ref_fd);
                break;
            }
            else if (p1_wants_to_play && !p2_wants_to_play){
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
                printf("Player 2 does not want to continue. Informing Player 1 and closing connection...\n");
                snprintf(buf, sizeof(buf), "You said no. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
                // close(ref_fd);
                break;  // End the game
            }
            else if (!p1_wants_to_play && p2_wants_to_play){
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
                printf("Player 1 does not want to continue. Informing Player 2 and closing connection...\n");
                snprintf(buf, sizeof(buf), "You said no. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
                // close(ref_fd);
                break;  // End the game
            }
        }

        printf("Updated board is : \n");
            for (int i = 1; i < 4; i++) {
                for (int j = 1; j < 4; j++) {
                    printf("%c ", board[i][j]);
                }
                printf("\n");
            }

        snprintf(buf, sizeof(buf), "Updated board is:\n");
        for (int i = 1; i < 4; i++) {
            for (int j = 1; j < 4; j++) {
                snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "%c ", board[i][j]);
            }
            snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "\n");
        }
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);

        if(player == 0){
            player = 1;
        }
        else{
            player = 0;
        }
    

    if (mo == 9) {
        snprintf(buf, sizeof(buf), "It's a draw!\n");
        printf("It's a draw!\n");
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);

        char p1_response[BUF_MAX], p2_response[BUF_MAX];
        snprintf(buf, sizeof(buf), "Do you want to play another game? (yes/no)\n");
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
        int r1 = recvfrom(ref_fd, p1_response, BUF_MAX, 0, (struct sockaddr *)&client_addr1, &addr_len);
        // printf("Player 1 response: %s\n", p1_response);
        snprintf(buf, sizeof(buf), "Do you want to play another game? (yes/no)\n");
        sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
        int r2 = recvfrom(ref_fd, p2_response, BUF_MAX, 0, (struct sockaddr *)&client_addr2, &addr_len);
        // printf("Player 2 response: %s\n", p2_response);

        if(r1 > 0){
                p1_response[r1] = '\0';
                strtok(p1_response, "\n");
            }
            if(r2 > 0){
                p2_response[r2] = '\0';
                strtok(p2_response, "\n");
            }
            else{
                printf("Data from client not received\n");
                break;
            }


        int p1_wants_to_play = (strstr(p1_response, "yes") != NULL);
        int p2_wants_to_play = (strstr(p2_response, "yes") != NULL);

            if (p1_wants_to_play && p2_wants_to_play) {
                // Both players want to play again
                printf("Both players want to play again. Restarting the game...\n");
                reset_board(board);  // Reset the board for a new game
                mo = 0;
                player = 0;
                continue;  // Start a new game
            }
            else if (!p1_wants_to_play && !p2_wants_to_play){
                printf("Both players don't want to play again. Exiting...\n");
                snprintf(buf, sizeof(buf), "Both players don't want to play again. Exiting...\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
                // close(ref_fd);
                break;
            }
            else if (p1_wants_to_play && !p2_wants_to_play){
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
                printf("Player 2 does not want to continue. Informing Player 1 and closing connection...\n");
                snprintf(buf, sizeof(buf), "You said no. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
                // close(ref_fd);
                break;  // End the game
            }
            else if (!p1_wants_to_play && p2_wants_to_play){
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr2, addr_len);
                printf("Player 1 does not want to continue. Informing Player 2 and closing connection...\n");
                snprintf(buf, sizeof(buf), "You said no. Connection will now close.\n");
                sendto(ref_fd, buf, strlen(buf), 0, (struct sockaddr *)&client_addr1, addr_len);
                // close(ref_fd);
                break;  // End the game
            }
    }
}

    close(ref_fd);
    return 0;
}
