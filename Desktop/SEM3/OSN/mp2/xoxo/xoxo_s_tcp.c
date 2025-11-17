#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/time.h>

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
    for(int i=0;i<4;i++){
        for(int j=0;j<4;j++){
            board[i][j] = '.';
        }
    }
    int player = 0;

    int ref_fd;
    int p1_fd;
    int p2_fd;

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);
    int addlen = sizeof(address);

    int opt = 1;

    ref_fd = socket(AF_INET, SOCK_STREAM, 0);
    if(ref_fd == 0){
        printf("Socket error!\n");
        exit(EXIT_FAILURE);
    }

    // Set socket options to reuse address and port
    if (setsockopt(ref_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))) {
        printf("setsockopt error!\n");
        exit(EXIT_FAILURE);
    }

    if (bind(ref_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        printf("Bind error!\n");
        close(ref_fd);
        exit(EXIT_FAILURE);
    }

    if (listen(ref_fd, 3) < 0) {
        printf("Listen error!\n");
        close(ref_fd);
        exit(EXIT_FAILURE);
    }

    p1_fd = accept(ref_fd, (struct sockaddr *)&address, (socklen_t*)&addlen);
    printf("p1 connected\n");
    p2_fd = accept(ref_fd, (struct sockaddr *)&address, (socklen_t*)&addlen);
    printf("p2 connected\n");

    // game ------------------------------
    char buf[BUF_MAX];
    int mo = 0;
    int cc; // current client
    while(1){
        if(player == 0){
            cc = p1_fd;
        }
        else{
            cc = p2_fd;
        }

        if(mo == 0){
            printf("current board is : \n");
            for (int i = 1; i < 4; i++) {
                for (int j = 1; j < 4; j++) {
                    printf("%c ", board[i][j]);
                }
                printf("\n");
            }

            snprintf(buf, sizeof(buf), "current board is : \n");
            for(int i=1;i<4;i++){
                for (int j=1;j<4;j++){
                    snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "%c ", board[i][j]);
                }
                snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "\n");
            }
            send(p1_fd, buf, strlen(buf), 0);
            send(p2_fd, buf, strlen(buf), 0);
        }
        
        

        snprintf(buf, sizeof(buf), "Your move, enter row col: ");
        send(cc, buf, strlen(buf), 0);

        int pd = recv(cc, buf, BUF_MAX, 0);
        if(pd <= 0){
            printf("Data from client not received\n");
            break;
        }

        buf[pd] = '\0';

        int r,c;
        if(sscanf(buf, "%d %d", &r, &c) != 2 || r < 1 || r > 3 || c < 1 || c > 3 || board[r][c] != '.'){
            snprintf(buf, sizeof(buf), "Invalid move, try again!!!\n");
            send(cc, buf, strlen(buf), 0);
            continue;
        }

        if(player == 0){
            board[r][c] = 'X';
        }
        else{
            board[r][c] = 'O';
        }

        mo++;

        int win = check_for_win(board);
        if(win){
            printf("winning board is : \n");
            for (int i = 1; i < 4; i++) {
                for (int j = 1; j < 4; j++) {
                    printf("%c ", board[i][j]);
                }
                printf("\n");
            }
            snprintf(buf, sizeof(buf), "Player %d wins!\n", player + 1);
            printf("Player %d wins!\n", player + 1);
            send(p1_fd, buf, strlen(buf), 0);
            send(p2_fd, buf, strlen(buf), 0);
            snprintf(buf, sizeof(buf), "winning board is : \n");
            for(int i=1;i<4;i++){
                for (int j=1;j<4;j++){
                    snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "%c ", board[i][j]);
                }
                snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "\n");
            }
            send(p1_fd, buf, strlen(buf), 0);
            send(p2_fd, buf, strlen(buf), 0);
            snprintf(buf, sizeof(buf), "Do you want to play another game? (yes/no)\n");
            send(p1_fd, buf, strlen(buf), 0);
            send(p2_fd, buf, strlen(buf), 0);

            // Collect responses from both players
            char p1_response[BUF_MAX], p2_response[BUF_MAX];
            int pd1 = recv(p1_fd, p1_response, BUF_MAX, 0);
            int pd2 = recv(p2_fd, p2_response, BUF_MAX, 0);

            if (pd1 > 0) {
                p1_response[pd1] = '\0';  // Null-terminate the received message
            }
            if (pd2 > 0) {
                p2_response[pd2] = '\0';  // Null-terminate the received message
            }

            // Check the responses and decide the next action
            int p1_wants_to_play = (strstr(p1_response, "yes") != NULL);
            int p2_wants_to_play = (strstr(p2_response, "yes") != NULL);

            if (p1_wants_to_play && p2_wants_to_play) {
                // Both players want to play again
                printf("Both players want to play again. Restarting the game...\n");
                reset_board(board);  // Reset the board for a new game
                mo = 0;
                player = 0;
                continue;  // Start a new game
            } else if (!p1_wants_to_play && !p2_wants_to_play) {
                // Both players want to end the game
                printf("Both players want to end the game. Closing the connection...\n");
                break;  // End the game
            } else if (p1_wants_to_play && !p2_wants_to_play) {
                // Player 1 wants to continue, but Player 2 does not
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                send(p1_fd, buf, strlen(buf), 0);
                printf("Player 2 does not want to continue. Informing Player 1 and closing connection...\n");
                break;  // End the game
            } else if (!p1_wants_to_play && p2_wants_to_play) {
                // Player 2 wants to continue, but Player 1 does not
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                send(p2_fd, buf, strlen(buf), 0);
                printf("Player 1 does not want to continue. Informing Player 2 and closing connection...\n");
                break;  // End the game
            }

        }

        printf("updated board is : \n");
            for (int i = 1; i < 4; i++) {
                for (int j = 1; j < 4; j++) {
                    printf("%c ", board[i][j]);
                }
                printf("\n");
            }

        snprintf(buf, sizeof(buf), "Updated board:\n");
        for (int i = 1; i < 4; i++) {
            for (int j = 1; j < 4; j++) {
                snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "%c ", board[i][j]);
            }
            snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), "\n");
        }
        send(p1_fd, buf, strlen(buf), 0);
        send(p2_fd, buf, strlen(buf), 0);

        if(player == 0){
            player = 1;
        }
        else{
            player = 0;
        }
        // snprintf(buf, sizeof(buf), "Player %d's turn (Enter your move as 'row col'): ", player + 1);
        // if(player == 0){
        //     send(p1_fd, buf, strlen(buf), 0);
        // }
        // else{
        //     send(p2_fd, buf, strlen(buf), 0);
        // }
    

        if(mo == 9){
            snprintf(buf, sizeof(buf), "It's a draw!\n");
            printf("It's a draw!\n");
            send(p1_fd, buf, strlen(buf), 0);
            send(p2_fd, buf, strlen(buf), 0);
            snprintf(buf, sizeof(buf), "Do you want to play another game? (yes/no)\n");
            send(p1_fd, buf, strlen(buf), 0);
            send(p2_fd, buf, strlen(buf), 0);

            // Collect responses from both players
            char p1_response[BUF_MAX], p2_response[BUF_MAX];
            int pd1 = recv(p1_fd, p1_response, BUF_MAX, 0);
            int pd2 = recv(p2_fd, p2_response, BUF_MAX, 0);

            if (pd1 > 0) {
                p1_response[pd1] = '\0';  // Null-terminate the received message
            }
            if (pd2 > 0) {
                p2_response[pd2] = '\0';  // Null-terminate the received message
            }

            // Check the responses and decide the next action
            int p1_wants_to_play = (strstr(p1_response, "yes") != NULL);
            int p2_wants_to_play = (strstr(p2_response, "yes") != NULL);

            if (p1_wants_to_play && p2_wants_to_play) {
                // Both players want to play again
                printf("Both players want to play again. Restarting the game...\n");
                reset_board(board);  // Reset the board for a new game
                mo = 0;
                player = 0;
                continue;  // Start a new game
            } else if (!p1_wants_to_play && !p2_wants_to_play) {
                // Both players want to end the game
                printf("Both players want to end the game. Closing the connection...\n");
                break;  // End the game
            } else if (p1_wants_to_play && !p2_wants_to_play) {
                // Player 1 wants to continue, but Player 2 does not
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                send(p1_fd, buf, strlen(buf), 0);
                printf("Player 2 does not want to continue. Informing Player 1 and closing connection...\n");
                break;  // End the game
            } else if (!p1_wants_to_play && p2_wants_to_play) {
                // Player 2 wants to continue, but Player 1 does not
                snprintf(buf, sizeof(buf), "Your opponent does not want to play again. Connection will now close.\n");
                send(p2_fd, buf, strlen(buf), 0);
                printf("Player 1 does not want to continue. Informing Player 2 and closing connection...\n");
                break;  // End the game
            }
        }

    }



    // game ------------------------------


    close(p1_fd);
    close(p2_fd);
    close(ref_fd);

    return 0;

}