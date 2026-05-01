import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const StyledLink = ({ children, className, href }: ButtonLinkProps) => (
  <Link to={href} className={className}>
    {children}
  </Link>
);

const StyledButton = styled(StyledLink)`
  margin: 1rem;
  padding: 1rem 1.5rem;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  transition: all 0.2s ease;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.bgDark};
  color: ${({ theme }) => theme.colors.text};
  text-transform: uppercase;
  :hover,
  :focus,
  :active {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonLink = ({ children, ...rest }: ButtonLinkProps) => {
  return <StyledButton {...rest}>{children}</StyledButton>;
};

export default ButtonLink;
