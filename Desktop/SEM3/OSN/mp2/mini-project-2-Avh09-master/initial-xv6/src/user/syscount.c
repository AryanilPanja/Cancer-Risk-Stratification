// syscount.c

#include "types.h"
#include "stat.h"
#include "user.h"

int
main(int argc, char *argv[])
{
  if (argc != 2) {
    printf("Usage: syscount <syscall_number>\n");
    exit(1);
  }

  int syscall_num = atoi(argv[1]);
  int count = getSysCount(syscall_num);

  if (count < 0) {
    printf("Invalid system call number.\n");
  } else {
    printf("System call %d was called %d times.\n", syscall_num, count);
  }

  exit(0);
}