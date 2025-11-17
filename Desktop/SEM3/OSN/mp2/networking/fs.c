#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/time.h>
#include <time.h>

#define CHUNK_SIZE 512
#define TIMEOUT 0.1
#define CLIENT_PORT 8080
#define SERVER_PORT 9090
#define MAX_RETRIES 5

typedef struct {
    int seq_num;
    int total_chunks; // Total number of chunks
    char data[CHUNK_SIZE];
} DataPacket;

typedef struct {
    int ack_num;
} AckPacket;

void set_non_blocking(int sockfd) {
    fcntl(sockfd, F_SETFL, O_NONBLOCK);
}

void send_packet(int sockfd, struct sockaddr_in *client_addr, socklen_t addr_len, DataPacket *packet) {
    sendto(sockfd, packet, sizeof(DataPacket), 0, (struct sockaddr*)client_addr, addr_len);
    printf("Server sent packet with sequence number %d\n", packet->seq_num);
}

void handle_client_communication(int sockfd, struct sockaddr_in *client_addr, socklen_t client_len) {
    DataPacket packet;
    AckPacket ack;

    while (1) {
        // Receive data from client
        recvfrom(sockfd, &packet, sizeof(DataPacket), 0, (struct sockaddr*)client_addr, &client_len);
        printf("Server received packet with sequence number %d\n", packet.seq_num);

        // Simulate skipping ACK for every third chunk
        if (packet.seq_num % 3 == 0) {
            printf("Server skipped ACK for sequence number %d\n", packet.seq_num);
            continue; 
        } 

        // Acknowledge the received packet
        ack.ack_num = packet.seq_num;
        sendto(sockfd, &ack, sizeof(AckPacket), 0, (struct sockaddr*)client_addr, client_len);
        printf("Server sent ACK for sequence number %d\n", ack.ack_num);
    }
}

int main() {
    int sockfd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_len = sizeof(client_addr);

    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(SERVER_PORT);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    bind(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    set_non_blocking(sockfd);

    // Handle client communication
    handle_client_communication(sockfd, &client_addr, client_len);

    close(sockfd);
    return 0;
}
