#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <errno.h>
#include <sys/time.h>
#include <fcntl.h>

#define CHUNK_SIZE 512
#define TIMEOUT 0.1  // Timeout for retransmission
#define SERVER_PORT 8080
#define MAX_RETRIES 5

typedef struct {
    int seq_num;
    char data[CHUNK_SIZE];
    int tot_chunks;
} DataPacket;

typedef struct {
    int ack_num;
} AckPacket;

void set_non_blocking(int sockfd) {
    fcntl(sockfd, F_SETFL, O_NONBLOCK);
}

void send_packet(int sockfd, struct sockaddr_in *client_addr, socklen_t addr_len, DataPacket *packet) {
    sendto(sockfd, packet, sizeof(DataPacket), 0, (struct sockaddr*)client_addr, addr_len);
    printf("Sent packet with sequence number %d\n", packet->seq_num);
}

void send_ack(int sockfd, struct sockaddr_in *client_addr, socklen_t addr_len, int seq_num) {
    AckPacket ack;
    ack.ack_num = seq_num;
    sendto(sockfd, &ack, sizeof(AckPacket), 0, (struct sockaddr*)client_addr, addr_len);
    printf("Sent ACK for sequence number %d\n", seq_num);
}

int main() {
    int sockfd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t cli_len = sizeof(client_addr);
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(SERVER_PORT);

    FILE *file;
    DataPacket packet;
    AckPacket ack;
    int tot = 0;
    int seq = 0;
    size_t nb;
    int fs;
    int retry = 0;
    int lastack_rev = -1;
    char file_data[10240] = {0};  // Buffer for storing the received data
    int expected_seq = 0;

    // Create UDP socket
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    if (bind(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind failed");
        close(sockfd);
        exit(EXIT_FAILURE);
    }

    file = fopen("largefile.txt", "rb");
    if (!file) {
        perror("File opening failed");
        close(sockfd);
        exit(EXIT_FAILURE);
    }

    fseek(file, 0, SEEK_END);
    fs = ftell(file);
    fseek(file, 0, SEEK_SET);
    tot = (fs + CHUNK_SIZE - 1) / CHUNK_SIZE;

    struct timeval send_time[tot];

    while((nb = fread(packet.data, 1, CHUNK_SIZE, file)) > 0){
        packet.seq_num = seq;
        packet.tot_chunks = tot;
        sendto(sockfd, &packet, sizeof(packet), 0, (struct sockaddr*)&client_addr, cli_len);
        gettimeofday(&send_time[seq], NULL);  // Log the send time for the current chunk
        printf("Sent chunk %d\n", seq);
        seq++;
    }

    // Wait for ACKs and manage retransmissions
    while (1) {
        int recv_res = recvfrom(sockfd, &ack, sizeof(ack), 0, NULL, NULL);
        if (recv_res > 0) {
            printf("Received ACK for chunk %d\n", ack.ack_num);
            lastack_rev = ack.ack_num;  // Update the last ACK received
        } 
        else if (recv_res < 0 && (errno != EAGAIN && errno != EWOULDBLOCK)) {
            perror("recvfrom");
        }

        // Check for retransmission timeouts
        struct timeval current_time;
        gettimeofday(&current_time, NULL);

        for (int i = lastack_rev + 1; i < seq; i++) {
            long time_diff = (current_time.tv_sec - send_time[i].tv_sec) * 1000000L + (current_time.tv_usec - send_time[i].tv_usec);
            if (time_diff > TIMEOUT * 1000000L) {
                // Resend chunk if timeout has occurred
                printf("Resending chunk %d after timeout\n", i);
                send_packet(sockfd, &client_addr, cli_len, &packet);  // Resend the chunk
                gettimeofday(&send_time[i], NULL);  // Update send time for the retransmitted chunk
                retry++;
                if (retry == MAX_RETRIES) {
                    printf("Failed to send chunk %d after %d retries\n", i, retry);
                    exit(EXIT_FAILURE);
                }
            }
        }
        
        // Break when all chunks have been acknowledged
        if (lastack_rev == tot - 1) {
            printf("All chunks successfully transmitted and acknowledged.\n");
            break;
        }
    }

    fclose(file);
    
    // Receiving side logic to handle incoming packets and sending ACKs
    while (1) {
        int recv_res = recvfrom(sockfd, &packet, sizeof(packet), 0, (struct sockaddr *)&client_addr, &cli_len);
        if (recv_res > 0) {
            if (packet.seq_num == expected_seq) {
                // Store received chunk data in correct sequence
                memcpy(file_data + expected_seq * CHUNK_SIZE, packet.data, CHUNK_SIZE);
                
                // Simulate loss by skipping ACK for every 3rd packet
                if (expected_seq % 3 != 0) {
                    send_ack(sockfd, &client_addr, cli_len, packet.seq_num);
                } else {
                    printf("Skipping ACK for chunk %d to simulate loss\n", expected_seq);
                }
                
                expected_seq++;
            }

            // If all chunks are received, print the data
            if (expected_seq == packet.tot_chunks) {
                printf("File received: %s\n", file_data);
                break;
            }
        } else if (recv_res < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
            continue;  // No data, keep polling
        } else {
            perror("recvfrom");
        }
    }

    close(sockfd);
    return 0;
    
}




// int recv_res = recvfrom(sockfd, &ack, sizeof(ack), 0, NULL, NULL);
    // if (recv_res > 0) {
    //     printf("Received ACK for chunk %d\n", ack.ack_num);
    //     lastack_rev = ack.ack_num;  // Update the last ACK received
    // } 
    // else if (recv_res < 0 && (errno != EAGAIN && errno != EWOULDBLOCK)) {
    //     perror("recvfrom");
    // }


    // struct timeval current_time;
    // gettimeofday(&current_time, NULL);
    // for (int i = lastack_rev + 1; i < seq; i++) {
    //     long time_diff = (current_time.tv_sec - send_time[i].tv_sec) * 1000000L + (current_time.tv_usec - send_time[i].tv_usec);
    //     if (time_diff > TIMEOUT * 1000000L) {
    //         // Resend chunk if timeout has occurred
    //         printf("Resending chunk %d after timeout\n", i);
    //         sendto(sockfd, &packet, sizeof(packet), 0, (struct sockaddr *) &client_addr, cli_len);
    //         gettimeofday(&send_time[i], NULL);  // Update send time for the retransmitted chunk
    //         retry++;
    //         if (retry == MAX_RETRIES) {
    //             printf("Failed to send chunk %d after %d retries\n", i, retry);
    //             exit(EXIT_FAILURE);
    //         }
    //     }
    // }

    // fclose(file);
    
    // while (1) {
    //     int recv_res = recvfrom(sockfd, &packet, sizeof(packet), 0, (struct sockaddr *)&client_addr, &cli_len);
    //     if (recv_res > 0) {
    //         if (packet.seq_num == expected_seq) {
    //             memcpy(file_data + expected_seq * CHUNK_SIZE, packet.data, CHUNK_SIZE);
                
    //             // Randomly drop every 3rd ACK to simulate loss
    //             if (expected_seq % 3 != 0) {
    //                 ack.ack_num = packet.seq_num;
    //                 sendto(sockfd, &ack, sizeof(ack), 0, (struct sockaddr *)&client_addr, cli_len);
    //                 printf("Sent ACK for chunk %d\n", expected_seq);
    //             } else {
    //                 printf("Skipping ACK for chunk %d to simulate loss\n", expected_seq);
    //             }
                
    //             expected_seq++;
    //         }

    //         if (expected_seq == packet.tot_chunks) {
    //             printf("File received: %s\n", file_data);
    //             break;
    //         }
    //     } else if (recv_res < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
    //         // No data received, continue polling
    //         continue;
    //     } else {
    //         perror("recvfrom");
    //     }
    // }

    // close(sockfd);
    // return 0;