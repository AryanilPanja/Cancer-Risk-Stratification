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
#define SERVER_PORT 9090
#define CLIENT_PORT 8080
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

void send_packet(int sockfd, struct sockaddr_in *server_addr, socklen_t addr_len, DataPacket *packet) {
    sendto(sockfd, packet, sizeof(DataPacket), 0, (struct sockaddr*)server_addr, addr_len);
    printf("Client sent packet with sequence number %d\n", packet->seq_num);
}

void handle_server_communication(int sockfd) {
    AckPacket ack;

    while (1) {
        // Receive ACK from server
        int recv_res = recvfrom(sockfd, &ack, sizeof(AckPacket), 0, NULL, NULL);
        if (recv_res > 0) {
            printf("Client received ACK for sequence number %d\n", ack.ack_num);
        } else if (recv_res < 0 && (errno != EAGAIN && errno != EWOULDBLOCK)) {
            perror("recvfrom");
        }
    }
}

int main() {
    int sockfd;
    struct sockaddr_in server_addr;
    socklen_t serv_len = sizeof(server_addr);
    DataPacket packet;
    int seq = 0, total_chunks = 0;
    size_t nb;

    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(SERVER_PORT);
    inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr);

    set_non_blocking(sockfd);  // Set the socket to non-blocking mode

    FILE *file = fopen("server_tcp.c", "rb");
    if (!file) {
        perror("File opening failed");
        close(sockfd);
        exit(EXIT_FAILURE);
    }

    // Calculate total chunks based on file size
    fseek(file, 0, SEEK_END);
    long file_size = ftell(file);
    fseek(file, 0, SEEK_SET);
    total_chunks = (file_size + CHUNK_SIZE - 1) / CHUNK_SIZE; // Calculate total chunks
    printf("Total chunks to send: %d\n", total_chunks);

    // Start a separate thread/process for handling server ACKs
    pid_t pid = fork();
    if (pid == 0) {
        handle_server_communication(sockfd);
        exit(0);
    }

    while ((nb = fread(packet.data, 1, CHUNK_SIZE, file)) > 0) {
        packet.seq_num = seq;
        packet.total_chunks = total_chunks;
        send_packet(sockfd, &server_addr, serv_len, &packet);
        seq++;
    }

    printf("File transfer completed.\n");
    fclose(file);
    close(sockfd);
    return 0;
}
