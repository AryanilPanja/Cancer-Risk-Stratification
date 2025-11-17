#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/time.h>
#include <fcntl.h>

#define CHUNK_SIZE 1024
#define SERVER_PORT 8888
#define TIMEOUT 0.1  // Timeout for retransmission

typedef struct {
    int seq_num;
    char data[CHUNK_SIZE];
} DataPacket;

typedef struct {
    int ack_num;
} AckPacket;

void set_non_blocking(int sockfd) {
    fcntl(sockfd, F_SETFL, O_NONBLOCK);
}

void send_ack(int sockfd, struct sockaddr_in *server_addr, socklen_t addr_len, int seq_num) {
    AckPacket ack;
    ack.ack_num = seq_num;
    sendto(sockfd, &ack, sizeof(AckPacket), 0, (struct sockaddr*)server_addr, addr_len);
    printf("Sent ACK for sequence number %d\n", seq_num);
}

void send_packet(int sockfd, struct sockaddr_in *server_addr, socklen_t addr_len, DataPacket *packet) {
    sendto(sockfd, packet, sizeof(DataPacket), 0, (struct sockaddr*)server_addr, addr_len);
    printf("Sent packet with sequence number %d\n", packet->seq_num);
}

int main() {
    int sockfd;
    struct sockaddr_in server_addr;
    socklen_t addr_len = sizeof(server_addr);
    DataPacket packet;
    AckPacket ack;
    FILE *file;
    int expected_seq = 0;

    // Create UDP socket
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    // Set up server address
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(SERVER_PORT);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    set_non_blocking(sockfd);  // Make the socket non-blocking

    file = fopen("received_file.txt", "wb");
    if (!file) {
        perror("File opening failed");
        close(sockfd);
        exit(EXIT_FAILURE);
    }

    fd_set read_fds;
    struct timeval timeout;

    while (1) {
        FD_ZERO(&read_fds);
        FD_SET(sockfd, &read_fds);

        timeout.tv_sec = 0;
        timeout.tv_usec = TIMEOUT * 1000000;

        int activity = select(sockfd + 1, &read_fds, NULL, NULL, &timeout);

        if (activity < 0) {
            perror("Select error");
            break;
        }

        // Receive data packet from server
        if (FD_ISSET(sockfd, &read_fds)) {
            int bytes_received = recvfrom(sockfd, &packet, sizeof(DataPacket), 0, (struct sockaddr*)&server_addr, &addr_len);
            if (bytes_received > 0) {
                if (packet.seq_num == expected_seq) {
                    printf("Received packet %d\n", packet.seq_num);
                    fwrite(packet.data, 1, bytes_received - sizeof(int), file);  // Write the data to file

                    // Send ACK
                    send_ack(sockfd, &server_addr, addr_len, expected_seq);
                    expected_seq++;
                }
            }
        }
    }

    fclose(file);
    close(sockfd);
    return 0;
}
